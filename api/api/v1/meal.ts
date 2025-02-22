import type { VercelRequest, VercelResponse } from '@vercel/node'
import 'dotenv/config'

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

function validateQueries(response: VercelResponse, province: string, school: string, date: string) {
  // 쿼리 누락 확인
  if (!province || !school || !date) {
    return response.status(400).json({
      error: {
        code: 400,
        message: '쿼리가 누락되었습니다.',
      },
    })
  }

  // 쿼리 형식 검증
  if (
    !/^[A-Z]\d{2}$/.test(province as string) || // A00
    !/^\d+$/.test(school as string) || // 000000..
    !/^\d{4}(-\d{2}){2}$|^\d{8}$/.test(date as string) // YYYYMMDD or YYYY-MM-DD
  ) {
    return response.status(400).json({
      error: {
        code: 400,
        message: '쿼리의 형식이 잘못되었습니다.',
      },
    })
  }
}

function handleNeisStatus(response: VercelResponse, status: string) {
  if (status === 'ERROR-300') {
    return response.status(400).json({
      error: {
        code: 400,
        message: '쿼리가 누락되었습니다.',
      },
    })
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
    return response.status(400).json({
      error: {
        code: 500,
        message: '데이터를 불러오는 데 실패했습니다.',
      },
    })
  } else if (status === 'ERROR-337') {
    return response.status(429).json({
      error: {
        code: 429,
        message: '오늘 호출 횟수를 초과했습니다.',
      },
    })
  }
}

function formatMeal(meal: Record<string, string>): MealResponse[number]['meals'][number] {
  const menu = meal.DDISH_NM.split('<br/>').map((m) => {
    const match = m.match(/^\s*(.*?)\s*(?:\(([0-9.]+)\))?\s*$/)

    if (!match) return { name: m.trim(), allergens: [] }

    const [, name, allergens] = match

    return { name, allergens: allergens ? allergens.split('.').map(Number) : [] }
  })

  // 돼지고기 : 국내산 -> { '돼지고기': '국내산' }
  const origin = meal.ORPLC_INFO.split('<br/>').reduce(
    (acc, curr) => {
      const [key, value] = curr.split(':')
      acc[key.trim()] = value.trim()
      return acc
    },
    {} as Record<string, string>,
  )

  // 탄수화물(g) : 139.0 -> { '탄수화물': '139.0g' }
  const nutrition = meal.NTR_INFO.split('<br/>').reduce(
    (acc, curr) => {
      const [key, value] = curr.split(' : ')
      const name = key.replace(/\([^)]*\)/g, '').trim()
      acc[name] = `${value}${key.match(/\(([^)]+)\)/)?.[1] || ''}`
      return acc
    },
    {} as Record<string, string>,
  )

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
  const { province, school, date } = request.query

  try {
    // 쿼리 검증
    validateQueries(response, province as string, school as string, date as string)

    // NEIS API 호출
    const result = await fetch(
      `https://open.neis.go.kr/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=${province}&SD_SCHUL_CODE=${school}&MLSV_YMD=${(date as string).replace(/-/g, '')}&Type=json&KEY=${process.env.NEIS_API_KEY}`,
    )
      .then((res) => res.json())
      .catch((err) => {
        console.error(err)

        return response.status(500).json({
          error: {
            code: 500,
            message: '데이터를 불러오는 데 실패했습니다.',
          },
        })
      })

    // 상태 오류 처리
    const status = result.mealServiceDietInfo ? result.mealServiceDietInfo[0].head[1].RESULT.CODE : result.RESULT.CODE
    handleNeisStatus(response, status)
    if (status === 'INFO-200') return response.status(200).json([])

    const data = result.mealServiceDietInfo[1].row

    const meals: MealResponse = []

    for (const meal of data) {
      const formattedDate = `${meal.MLSV_YMD.slice(0, 4)}-${meal.MLSV_YMD.slice(4, 6)}-${meal.MLSV_YMD.slice(6, 8)}`

      if (!meals.find((m) => m.date === formattedDate)) {
        meals.push({
          date: formattedDate,
          meals: [],
        })
      }

      meals.find((m) => m.date === formattedDate)?.meals.push(formatMeal(meal))
    }

    return response.status(200).json(meals)
  } catch (err) {
    console.error(err)

    return response.status(500).json({
      error: {
        code: 500,
        message: '서버 오류가 발생했습니다.',
      },
    })
  }
}
