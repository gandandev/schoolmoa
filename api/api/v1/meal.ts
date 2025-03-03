import type { VercelRequest, VercelResponse } from '@vercel/node'
import 'dotenv/config'
import type { NeisMealResponse, NeisMealResponseRow } from '../../types/neis'
import { validateDefaultQueries } from '../../utils/validation'
import { handleNeisStatus } from '../../utils/neis'

const PAGE_SIZE = 1000

/**
 * /api/v1/meal 응답 형식
 */
export type MealResponse = {
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

/**
 * 나이스 급식식단정보 API 응답 형식 개선
 * @param meal 나이스 급식식단정보 API 응답
 * @returns 개선된 급식 응답 형식
 */
export function formatMeal(meal: NeisMealResponseRow): MealResponse[number]['meals'][number] {
  const menu = meal.DDISH_NM.split('<br/>').map((m) => {
    const item = m.trim()

    // 형식 1: 메뉴이름 (1.2.3.)
    // 헝식 2: 메뉴이름1.2.3.
    // \s*       공백 제거
    // (.*?)     메뉴 이름, ?로 뒤의 알레르기 정보까지 선택되지 않도록 게으르게 조정
    // \s*       공백 제거
    // \(?       여는 괄호, 없을 수 있음
    // [0-9. ]+  알레르기 정보: 숫자 + 점 + 공백
    // \)?       닫는 괄호, 없을 수 있음
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
          if (!curr) return acc // 빈 문자열이면 건너뜀
          const parts = curr.split(':')
          if (parts.length < 2) return acc
          const [key, value] = parts
          const name = key.replace(/\([^)]*\)/g, '').trim() // 단위 괄호 제거
          acc[name] = `${Number(value)}${key.match(/\(([^)]+)\)/)?.[1] || ''}` // 값 + 단위 형식으로 저장
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
      !validateDefaultQueries(province as string, school as string, {
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
      pIndex: '1',
      pSize: String(PAGE_SIZE),
      Type: 'json',
      KEY: process.env.NEIS_API_KEY,
    })

    // YYYYMMDD 형식으로 변환(- 제거) 후 쿼리에 추가
    if (date) {
      params.append('MLSV_YMD', (date as string).replace(/-/g, ''))
    } else {
      params.append('MLSV_FROM_YMD', (startDate as string).replace(/-/g, ''))
      params.append('MLSV_TO_YMD', (endDate as string).replace(/-/g, ''))
    }

    const fetchPage = async (pageIndex: number): Promise<NeisMealResponse | null> => {
      const pageParams = new URLSearchParams(params)
      if (pageIndex > 1) {
        pageParams.set('pIndex', pageIndex.toString())
      }

      return fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?${pageParams.toString()}`)
        .then((res) => res.json())
        .catch((err) => {
          console.error(`Error fetching page ${pageIndex}:`, err)
          return null
        })
    }

    // 첫 번째 페이지 데이터 가져오기
    const firstPageResult = await fetchPage(1)
    if (!firstPageResult) {
      return response.status(500).json({
        error: {
          code: 500,
          message: '데이터를 불러오는 데 실패했습니다.',
        },
      })
    }

    // 상태 오류 처리
    const status =
      'mealServiceDietInfo' in firstPageResult
        ? firstPageResult.mealServiceDietInfo[0].head[1].RESULT.CODE
        : firstPageResult.RESULT?.CODE

    const statusResult = handleNeisStatus(status)
    if (statusResult) return response.status(statusResult.status).json(statusResult.body)
    if (status === 'INFO-200') return response.status(200).json([])
    if (!('mealServiceDietInfo' in firstPageResult)) {
      return response.status(500).json({
        error: {
          code: 500,
          message: '데이터를 불러오는 데 실패했습니다.',
        },
      })
    }

    // 전체 데이터 수 확인
    const totalCount = firstPageResult.mealServiceDietInfo[0].head[0].list_total_count
    const totalPages = Math.ceil(totalCount / PAGE_SIZE)

    let allData = [...firstPageResult.mealServiceDietInfo[1].row]

    // 페이지가 더 필요할 경우 병렬로 가져오기
    if (totalPages > 1) {
      const additionalPagePromises: Promise<NeisMealResponse | null>[] = []

      for (let pageIndex = 2; pageIndex <= totalPages; pageIndex++) {
        additionalPagePromises.push(fetchPage(pageIndex))
      }

      const additionalPageResults = await Promise.all(additionalPagePromises)

      // 데이터 합치기
      for (const pageResult of additionalPageResults) {
        if (pageResult && 'mealServiceDietInfo' in pageResult) {
          allData = [...allData, ...pageResult.mealServiceDietInfo[1].row]
        }
      }
    }

    // 날짜별로 급식 데이터 모으기
    const mealsByDate: Record<string, NeisMealResponseRow[]> = {}

    for (const meal of allData) {
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
