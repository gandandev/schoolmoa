import { describe, test, expect, afterAll, afterEach, beforeAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import type { Request, Response } from 'express'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from './meal'
import { validateDate, validateQueries, handleNeisStatus, formatMeal } from './meal'
import { startServer, resetServer, closeServer } from './__mocks__/mealServer'
import {
  singleMealResponse,
  multipleMealsResponse,
  multipleDaysResponse,
  errorResponses,
} from './__mocks__/mealTestData'

const app = express()
app.get('/api/v1/meal', (req: Request, res: Response) => {
  handler(req as VercelRequest, res as unknown as VercelResponse)
})

// 나이스 Mock API 설정
beforeAll(() => startServer())
afterEach(() => resetServer())
afterAll(() => closeServer())

describe('API', () => {
  describe('하루 급식 조회', () => {
    test('정상 요청 (중식)', async () => {
      const response = await request(app).get('/api/v1/meal').query({
        province: 'D10', // 대구광역시
        school: '7261044', // 대구대성초등학교
        date: '2024-03-20',
      })

      expect(response.status).toBe(200)
      expect(response.type).toBe('application/json')
      expect(response.body).toEqual(singleMealResponse)
    })

    test('정상 요청 (조식, 중식)', async () => {
      const response = await request(app).get('/api/v1/meal').query({
        province: 'B10', // 서울특별시
        school: '7010084', // 서울과학고등학교
        date: '2024-03-15',
      })

      expect(response.status).toBe(200)
      expect(response.type).toBe('application/json')
      expect(response.body).toEqual(multipleMealsResponse)
    })

    test('급식 정보가 없는 경우', async () => {
      const response = await request(app).get('/api/v1/meal').query({
        province: 'T10', // 제주특별자치도
        school: '9290079', // 제주제일고등학교부설방송통신고등학교
        date: '2025-01-20',
      })

      expect(response.status).toBe(200)
      expect(response.type).toBe('application/json')
      expect(response.body).toEqual([])
    })

    test('누락된 쿼리가 있는 경우', async () => {
      const response = await request(app).get('/api/v1/meal').query({
        province: 'M10',
        date: '2024-03-20',
      })

      expect(response.status).toBe(400)
      expect(response.type).toBe('application/json')
      expect(response.body).toEqual(errorResponses.badQuery)
    })

    test('쿼리의 형식이 잘못된 경우', async () => {
      const response = await request(app).get('/api/v1/meal').query({
        province: 'Hello, world!',
        school: 'ABCD',
        date: '안녕하세요',
      })

      expect(response.status).toBe(400)
      expect(response.type).toBe('application/json')
      expect(response.body).toEqual(errorResponses.badQuery)
    })
  })

  describe('여러 날짜 급식 조회', () => {
    test('정상 요청 (5일)', async () => {
      const response = await request(app).get('/api/v1/meal').query({
        province: 'K10', // 강원특별자치도
        school: '7872032', // 정라초등학교
        startDate: '2024-03-18',
        endDate: '2024-03-22',
      })

      expect(response.status).toBe(200)
      expect(response.type).toBe('application/json')
      expect(response.body).toEqual(multipleDaysResponse)
    })

    test('시작일이 종료일보다 늦은 경우', async () => {
      const response = await request(app).get('/api/v1/meal').query({
        province: 'Q10', // 전라남도
        school: '8521007', // 순천연향중학교
        endDate: '2024-03-20',
      })

      expect(response.status).toBe(400)
      expect(response.type).toBe('application/json')
      expect(response.body).toEqual(errorResponses.badQuery)
    })

    test('날짜 범위와 한 날짜를 동시에 요청한 경우', async () => {
      const response = await request(app).get('/api/v1/meal').query({
        province: 'B10', // 서울특별시
        school: '7130112', // 서울고덕초등학교
        date: '2024-03-20',
        startDate: '2024-03-20',
        endDate: '2024-03-22',
      })

      expect(response.status).toBe(400)
      expect(response.type).toBe('application/json')
      expect(response.body).toEqual(errorResponses.badQuery)
    })

    test('날짜 범위 중 하나만 요청한 경우', async () => {
      const response = await request(app).get('/api/v1/meal').query({
        province: 'E10', // 인천광역시
        school: '7331247', // 인천계양초등학교 상야분교장
        startDate: '2024-03-20',
      })

      expect(response.status).toBe(400)
      expect(response.type).toBe('application/json')
      expect(response.body).toEqual(errorResponses.badQuery)
    })
  })
})

describe('날짜 형식 확인', () => {
  test('올바른 형식 (YYYY-MM-DD)', () => {
    expect(validateDate('2024-03-20')).toBe(true)
  })

  test('올바른 형식 (YYYYMMDD)', () => {
    expect(validateDate('20240320')).toBe(true)
  })

  test('잘못된 형식', () => {
    expect(validateDate('2024-03-20T12:00:00')).toBe(false)
    expect(validateDate('2024/03/20')).toBe(false)
    expect(validateDate('2024.03.20')).toBe(false)
  })

  test('날짜가 아님', () => {
    expect(validateDate('ㅁㄴㅇㄹ')).toBe(false)
    expect(validateDate('')).toBe(false)
  })
})

describe('쿼리 유효성 검사', () => {
  test('모든 필드가 유효한 경우 (단일 날짜)', () => {
    expect(
      validateQueries('B10', '7010084', {
        date: '2024-03-15',
        startDate: undefined,
        endDate: undefined,
      }),
    ).toBe(true)
  })

  test('모든 필드가 유효한 경우 (날짜 범위)', () => {
    expect(
      validateQueries('K10', '7872032', {
        date: undefined,
        startDate: '2024-03-18',
        endDate: '2024-03-22',
      }),
    ).toBe(true)
  })

  test('필수 필드가 누락된 경우', () => {
    expect(
      validateQueries('', '7010084', {
        date: '2024-03-15',
        startDate: undefined,
        endDate: undefined,
      }),
    ).toBe(false)

    expect(
      validateQueries('B10', '', {
        date: '2024-03-15',
        startDate: undefined,
        endDate: undefined,
      }),
    ).toBe(false)
  })

  test('날짜 필드가 누락된 경우', () => {
    expect(
      validateQueries('B10', '7010084', {
        date: undefined,
        startDate: undefined,
        endDate: undefined,
      }),
    ).toBe(false)
  })

  test('날짜 범위 중 하나만 있는 경우', () => {
    expect(
      validateQueries('B10', '7010084', {
        date: undefined,
        startDate: '2024-03-18',
        endDate: undefined,
      }),
    ).toBe(false)

    expect(
      validateQueries('B10', '7010084', {
        date: undefined,
        startDate: undefined,
        endDate: '2024-03-22',
      }),
    ).toBe(false)
  })

  test('단일 날짜와 날짜 범위가 동시에 있는 경우', () => {
    expect(
      validateQueries('B10', '7010084', {
        date: '2024-03-15',
        startDate: '2024-03-18',
        endDate: '2024-03-22',
      }),
    ).toBe(false)
  })

  test('시작일이 종료일보다 늦은 경우', () => {
    expect(
      validateQueries('B10', '7010084', {
        date: undefined,
        startDate: '2024-03-22',
        endDate: '2024-03-18',
      }),
    ).toBe(false)
  })

  test('잘못된 형식의 필드', () => {
    expect(
      validateQueries('B1', '7010084', {
        date: '2024-03-15',
        startDate: undefined,
        endDate: undefined,
      }),
    ).toBe(false)

    expect(
      validateQueries('B10', 'ABC', {
        date: '2024-03-15',
        startDate: undefined,
        endDate: undefined,
      }),
    ).toBe(false)

    expect(
      validateQueries('B10', '7010084', {
        date: '2024/03/15',
        startDate: undefined,
        endDate: undefined,
      }),
    ).toBe(false)
  })
})

describe('나이스 상태 코드 처리', () => {
  test('ERROR-300 처리', () => {
    const result = handleNeisStatus('ERROR-300')
    expect(result).toEqual({
      status: 400,
      body: {
        error: {
          code: 400,
          message: '쿼리가 누락되었습니다.',
        },
      },
    })
  })

  test('ERROR-337 처리', () => {
    const result = handleNeisStatus('ERROR-337')
    expect(result).toEqual({
      status: 429,
      body: {
        error: {
          code: 429,
          message: '오늘 호출 횟수를 초과했습니다.',
        },
      },
    })
  })

  test('기타 오류 처리', () => {
    const errorCodes = [
      'ERROR-290',
      'ERROR-310',
      'ERROR-333',
      'ERROR-336',
      'ERROR-500',
      'ERROR-600',
      'ERROR-601',
      'INFO-300',
    ]

    for (const code of errorCodes) {
      expect(handleNeisStatus(code)).toEqual({
        status: 500,
        body: {
          error: {
            code: 500,
            message: '데이터를 불러오는 데 실패했습니다.',
          },
        },
      })
    }
  })

  test('정상 상태 코드 처리', () => {
    const result = handleNeisStatus('INFO-000')
    expect(result).toBeNull()
  })
})

describe('급식 데이터 정리', () => {
  test('메뉴 및 알레르기 정보 파싱', () => {
    const mockMeal = {
      MMEAL_SC_NM: '중식',
      MMEAL_SC_CODE: '2',
      MLSV_FGR: '206',
      DDISH_NM: '맑은콩나물국 (5.6)<br/>지코바치밥 (1.2.5.12.15)<br/>깍두기 (9)',
      ORPLC_INFO: '돼지고기 : 국내산<br/>쌀 : 국내산',
      CAL_INFO: '596.5 Kcal',
      NTR_INFO: '탄수화물(g) : 75.1<br/>단백질(g) : 30.9<br/>지방(g) : 17.8',
    }

    const formatted = formatMeal(mockMeal)

    expect(formatted.type).toBe('중식')
    expect(formatted.typeCode).toBe(2)
    expect(formatted.headCount).toBe(206)
    expect(formatted.calorie).toBe(596.5)

    // 메뉴 확인
    expect(formatted.menu).toHaveLength(3)
    expect(formatted.menu[0]).toEqual({ name: '맑은콩나물국', allergens: [5, 6] })
    expect(formatted.menu[1]).toEqual({ name: '지코바치밥', allergens: [1, 2, 5, 12, 15] })
    expect(formatted.menu[2]).toEqual({ name: '깍두기', allergens: [9] })

    // 원산지 확인
    expect(formatted.origin).toEqual({
      돼지고기: '국내산',
      쌀: '국내산',
    })

    // 영양정보 확인
    expect(formatted.nutrition).toEqual({
      탄수화물: '75.1g',
      단백질: '30.9g',
      지방: '17.8g',
    })
  })

  test('알레르기 정보가 없는 메뉴 처리', () => {
    const mockMeal = {
      MMEAL_SC_NM: '중식',
      MMEAL_SC_CODE: '2',
      MLSV_FGR: '206',
      DDISH_NM: '맑은콩나물국<br/>지코바치밥<br/>깍두기',
      ORPLC_INFO: '돼지고기 : 국내산<br/>쌀 : 국내산',
      CAL_INFO: '596.5 Kcal',
      NTR_INFO: '탄수화물(g) : 75.1<br/>단백질(g) : 30.9<br/>지방(g) : 17.8',
    }

    const formatted = formatMeal(mockMeal)

    expect(formatted.menu).toHaveLength(3)
    expect(formatted.menu[0]).toEqual({ name: '맑은콩나물국', allergens: [] })
    expect(formatted.menu[1]).toEqual({ name: '지코바치밥', allergens: [] })
    expect(formatted.menu[2]).toEqual({ name: '깍두기', allergens: [] })
  })

  test('다양한 괄호 형식의 알레르기 정보 처리', () => {
    const mockMeal = {
      MMEAL_SC_NM: '중식',
      MMEAL_SC_CODE: '2',
      MLSV_FGR: '206',
      DDISH_NM: '맑은콩나물국(5.6)<br/>지코바치밥 (1.2.5)<br/>깍두기(9)',
      ORPLC_INFO: '돼지고기 : 국내산<br/>쌀 : 국내산',
      CAL_INFO: '596.5 Kcal',
      NTR_INFO: '탄수화물(g) : 75.1<br/>단백질(g) : 30.9<br/>지방(g) : 17.8',
    }

    const formatted = formatMeal(mockMeal)

    expect(formatted.menu).toHaveLength(3)
    expect(formatted.menu[0]).toEqual({ name: '맑은콩나물국', allergens: [5, 6] })
    expect(formatted.menu[1]).toEqual({ name: '지코바치밥', allergens: [1, 2, 5] })
    expect(formatted.menu[2]).toEqual({ name: '깍두기', allergens: [9] })
  })

  test('빈 원산지와 영양정보 처리', () => {
    const mockMeal = {
      MMEAL_SC_NM: '중식',
      MMEAL_SC_CODE: '2',
      MLSV_FGR: '206',
      DDISH_NM: '맑은콩나물국(5.6)',
      ORPLC_INFO: '',
      CAL_INFO: '596.5 Kcal',
      NTR_INFO: '',
    }

    const formatted = formatMeal(mockMeal)

    expect(formatted.menu).toHaveLength(1)
    expect(formatted.menu[0]).toEqual({ name: '맑은콩나물국', allergens: [5, 6] })
    expect(formatted.origin).toEqual({})
    expect(formatted.nutrition).toEqual({})
  })
})
