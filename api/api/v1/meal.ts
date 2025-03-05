import 'dotenv/config'
import type { NeisMealResponseRow } from '../../types/neis'
import { createApiHandler } from '../../utils/api'

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

/**
 * 날짜별로 급식 데이터 그룹화
 */
function groupMealsByDate(meals: NeisMealResponseRow[]): Record<string, NeisMealResponseRow[]> {
  return meals.reduce(
    (acc, meal) => {
      const formattedDate = `${meal.MLSV_YMD.slice(0, 4)}-${meal.MLSV_YMD.slice(4, 6)}-${meal.MLSV_YMD.slice(6, 8)}`
      if (!acc[formattedDate]) {
        acc[formattedDate] = []
      }
      acc[formattedDate].push(meal)
      return acc
    },
    {} as Record<string, NeisMealResponseRow[]>,
  )
}

/**
 * 그룹화된 급식 데이터를 최종 응답 형식으로 변환
 */
function formatMealResponse(data: NeisMealResponseRow[] | Record<string, NeisMealResponseRow[]>): MealResponse {
  const groupedMeals = Array.isArray(data) ? groupMealsByDate(data) : data
  return Object.entries(groupedMeals).map(([date, dateMeals]) => ({
    date,
    meals: dateMeals.map(formatMeal),
  }))
}

export default createApiHandler<NeisMealResponseRow>(
  {
    neisApiName: 'mealServiceDietInfo',
    groupData: groupMealsByDate,
    formatData: formatMealResponse,
  },
  { pageSize: 1000 },
)
