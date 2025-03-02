import type { VercelRequest, VercelResponse } from '@vercel/node'
import 'dotenv/config'
import type { NeisMealResponse } from '../../types/neis'

type MealResponse = {
  date: string
  meals: {
    type: string
    typeCode: number
    menu: {
      name: string
      allergens: number[]
    }[]
    headCount: number
    origin: Record<string, string>
    calorie: number
    nutrition: Record<string, string>
  }[]
}[]

export function validateDate(date: string) {
  return /^\d{4}(-\d{2}){2}$|^\d{8}$/.test(date)
}

export function validateQueries(province: string, school: string, { date, startDate, endDate }) {
  if (!province || !school) return false
  if (!/^[A-Z]\d{2}$/.test(province) || !/^\d+$/.test(school)) return false

  // 한 날짜 또는 날짜 범위 중 하나는 반드시 있어야 함
  if (!date && (!startDate || !endDate)) return false
  if (date && (startDate || endDate)) return false

  // 날짜 형식 검증
  if (date) return validateDate(date)
  if (startDate && endDate) {
    if (!validateDate(startDate) || !validateDate(endDate)) return false

    // startDate가 endDate 이후면 안 됨
    const start = startDate.replace(/-/g, '')
    const end = endDate.replace(/-/g, '')
    return start <= end
  }

  return false
}

export function handleNeisStatus(status: string) {
  if (status === 'ERROR-300') {
    return {
      status: 400,
      body: {
        error: {
          code: 400,
          message: '쿼리가 누락되었습니다.',
        },
      },
    }
  } else if (
    status === 'ERROR-290' ||
    status === 'ERROR-310' ||
    status === 'ERROR-333' ||
    status === 'ERROR-336' ||
    status === 'ERROR-500' ||
    status === 'ERROR-600' ||
    status === 'ERROR-601' ||
    status === 'INFO-300'
  ) {
    return {
      status: 400,
      body: {
        error: {
          code: 500,
          message: '데이터를 불러오는 데 실패했습니다.',
        },
      },
    }
  } else if (status === 'ERROR-337') {
    return {
      status: 429,
      body: {
        error: {
          code: 429,
          message: '오늘 호출 횟수를 초과했습니다.',
        },
      },
    }
  }

  return null
}

export function formatMeal(meal: Record<string, string>): MealResponse[number]['meals'][number] {
  const menu = meal.DDISH_NM.split('<br/>').map((m) => {
    // 형식 1: 메뉴이름 (1.2.3.)
    // 헝식 2: 메뉴이름1.2.3.
    const item = m.trim()
    const match = item.match(/^\s*(.*?)\s*\(?([0-9. ]+)\)?$/)
    if (match) {
      const [, name, allergenStr] = match
      if (allergenStr) {
        return {
          name, // \s*로 공백이 이미 제거되었으므로 .trim()하지 않아도 됨
          allergens: allergenStr.split('.').map(Number).filter(Boolean),
        }
      }
    }

    return { name: item, allergens: [] }
  })

  // 돼지고기 : 국내산 -> { '돼지고기': '국내산' }
  const origin = meal.ORPLC_INFO
    ? meal.ORPLC_INFO.split('<br/>').reduce(
        (acc, curr) => {
          if (!curr) return acc
          const parts = curr.split(':')
          if (parts.length < 2) return acc
          const [key, value] = parts
          acc[key.trim()] = value.trim()
          return acc
        },
        {} as Record<string, string>,
      )
    : {}

  // 탄수화물(g) : 139.0 -> { '탄수화물': '139.0g' }
  const nutrition = meal.NTR_INFO
    ? meal.NTR_INFO.split('<br/>').reduce(
        (acc, curr) => {
          if (!curr) return acc
          const parts = curr.split(':')
          if (parts.length < 2) return acc
          const [key, value] = parts
          const name = key.replace(/\([^)]*\)/g, '').trim()
          acc[name] = `${Number(value)}${key.match(/\(([^)]+)\)/)?.[1] || ''}`
          return acc
        },
        {} as Record<string, string>,
      )
    : {}

  return {
    type: meal.MMEAL_SC_NM,
    typeCode: Number(meal.MMEAL_SC_CODE),
    menu,
    headCount: Number(meal.MLSV_FGR),
    origin,
    calorie: parseFloat(meal.CAL_INFO), // 소수점 처리 + 뒤의 Kcal 제거
    nutrition,
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const { province, school, date, startDate, endDate } = request.query

  try {
    if (!process.env.NEIS_API_KEY) throw new Error('NEIS_API_KEY is not defined')

    // 쿼리 검증
    if (
      !validateQueries(province as string, school as string, {
        date: date as string,
        startDate: startDate as string,
        endDate: endDate as string,
      })
    ) {
      response.status(400).json({
        error: {
          code: 400,
          message: '쿼리가 잘못되었습니다.',
        },
      })
      return
    }

    // 나이스 API 쿼리 생성
    const params = new URLSearchParams({
      ATPT_OFCDC_SC_CODE: province as string,
      SD_SCHUL_CODE: school as string,
      Type: 'json',
      KEY: process.env.NEIS_API_KEY,
    })

    if (date) {
      params.append('MLSV_YMD', (date as string).replace(/-/g, ''))
    } else {
      params.append('MLSV_FROM_YMD', (startDate as string).replace(/-/g, ''))
      params.append('MLSV_TO_YMD', (endDate as string).replace(/-/g, ''))
    }

    let result: NeisMealResponse
    try {
      const res = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?${params.toString()}`)
      result = await res.json()
    } catch (err) {
      console.error(err)
      response.status(500).json({
        error: {
          code: 500,
          message: '데이터를 불러오는 데 실패했습니다.',
        },
      })
      return
    }

    // 상태 오류 처리
    const status =
      'mealServiceDietInfo' in result ? result.mealServiceDietInfo[0].head[1].RESULT.CODE : result.RESULT.CODE

    const statusResult = handleNeisStatus(status)
    if (statusResult) {
      response.status(statusResult.status).json(statusResult.body)
      return
    }

    if (status === 'INFO-200') {
      response.status(200).json([])
      return
    }

    const data = 'mealServiceDietInfo' in result ? result.mealServiceDietInfo[1].row : []

    // 날짜별로 급식 데이터 모으기
    const mealsByDate: Record<string, Record<string, string>[]> = {}

    for (const meal of data) {
      const formattedDate = `${meal.MLSV_YMD.slice(0, 4)}-${meal.MLSV_YMD.slice(4, 6)}-${meal.MLSV_YMD.slice(6, 8)}`

      if (!mealsByDate[formattedDate]) {
        mealsByDate[formattedDate] = []
      }

      mealsByDate[formattedDate].push(meal)
    }

    // 모은 데이터 한 번에 처리
    const meals: MealResponse = Object.entries(mealsByDate).map(([date, dateMeals]) => ({
      date,
      meals: dateMeals.map(formatMeal),
    }))

    response.status(200).json(meals)
  } catch (err) {
    console.error(err)
    response.status(500).json({
      error: {
        code: 500,
        message: '서버 오류가 발생했습니다.',
      },
    })
  }
}
