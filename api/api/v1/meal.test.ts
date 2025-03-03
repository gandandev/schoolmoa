import { describe, test, expect, afterAll, afterEach, beforeAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import type { Request, Response } from 'express'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler, { MealResponse } from './meal'
import { formatMeal } from './meal'
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

describe('급식 데이터 정리', () => {
  test('메뉴 및 알레르기 정보 파싱', () => {
    const mockMeal = {
      ATPT_OFCDC_SC_CODE: 'B10',
      ATPT_OFCDC_SC_NM: '서울특별시',
      SD_SCHUL_CODE: '7010084',
      SCHUL_NM: '서울과학고등학교',
      MMEAL_SC_NM: '중식',
      MMEAL_SC_CODE: '2',
      MLSV_YMD: '20240320',
      MLSV_FGR: 206,
      DDISH_NM: '맑은콩나물국 (5.6)<br/>지코바치밥 (1.2.5.12.15)<br/>깍두기 (9)',
      ORPLC_INFO: '돼지고기 : 국내산<br/>쌀 : 국내산',
      CAL_INFO: '596.5 Kcal',
      NTR_INFO: '탄수화물(g) : 75.1<br/>단백질(g) : 30.9<br/>지방(g) : 17.8',
      MLSV_FROM_YMD: '',
      MLSV_TO_YMD: '',
      LOAD_DTM: '',
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
      ATPT_OFCDC_SC_CODE: 'B10',
      ATPT_OFCDC_SC_NM: '서울특별시',
      SD_SCHUL_CODE: '7010084',
      SCHUL_NM: '서울과학고등학교',
      MMEAL_SC_NM: '중식',
      MMEAL_SC_CODE: '2',
      MLSV_YMD: '20240320',
      MLSV_FGR: 206,
      DDISH_NM: '맑은콩나물국<br/>지코바치밥<br/>깍두기',
      ORPLC_INFO: '돼지고기 : 국내산<br/>쌀 : 국내산',
      CAL_INFO: '596.5 Kcal',
      NTR_INFO: '탄수화물(g) : 75.1<br/>단백질(g) : 30.9<br/>지방(g) : 17.8',
      MLSV_FROM_YMD: '',
      MLSV_TO_YMD: '',
      LOAD_DTM: '',
    }

    const formatted = formatMeal(mockMeal)

    expect(formatted.menu).toHaveLength(3)
    expect(formatted.menu[0]).toEqual({ name: '맑은콩나물국', allergens: [] })
    expect(formatted.menu[1]).toEqual({ name: '지코바치밥', allergens: [] })
    expect(formatted.menu[2]).toEqual({ name: '깍두기', allergens: [] })
  })

  test('다양한 괄호 형식의 알레르기 정보 처리', () => {
    const mockMeal = {
      ATPT_OFCDC_SC_CODE: 'B10',
      ATPT_OFCDC_SC_NM: '서울특별시',
      SD_SCHUL_CODE: '7010084',
      SCHUL_NM: '서울과학고등학교',
      MMEAL_SC_NM: '중식',
      MMEAL_SC_CODE: '2',
      MLSV_YMD: '20240320',
      MLSV_FGR: 206,
      DDISH_NM: '맑은콩나물국(5.6)<br/>지코바치밥 (1.2.5)<br/>깍두기(9)',
      ORPLC_INFO: '돼지고기 : 국내산<br/>쌀 : 국내산',
      CAL_INFO: '596.5 Kcal',
      NTR_INFO: '탄수화물(g) : 75.1<br/>단백질(g) : 30.9<br/>지방(g) : 17.8',
      MLSV_FROM_YMD: '',
      MLSV_TO_YMD: '',
      LOAD_DTM: '',
    }

    const formatted = formatMeal(mockMeal)

    expect(formatted.menu).toHaveLength(3)
    expect(formatted.menu[0]).toEqual({ name: '맑은콩나물국', allergens: [5, 6] })
    expect(formatted.menu[1]).toEqual({ name: '지코바치밥', allergens: [1, 2, 5] })
    expect(formatted.menu[2]).toEqual({ name: '깍두기', allergens: [9] })
  })

  test('빈 원산지와 영양정보 처리', () => {
    const mockMeal = {
      ATPT_OFCDC_SC_CODE: 'B10',
      ATPT_OFCDC_SC_NM: '서울특별시',
      SD_SCHUL_CODE: '7010084',
      SCHUL_NM: '서울과학고등학교',
      MMEAL_SC_NM: '중식',
      MMEAL_SC_CODE: '2',
      MLSV_YMD: '20240320',
      MLSV_FGR: 206,
      DDISH_NM: '맑은콩나물국(5.6)',
      ORPLC_INFO: '',
      CAL_INFO: '596.5 Kcal',
      NTR_INFO: '',
      MLSV_FROM_YMD: '',
      MLSV_TO_YMD: '',
      LOAD_DTM: '',
    }

    const formatted = formatMeal(mockMeal)

    expect(formatted.menu).toHaveLength(1)
    expect(formatted.menu[0]).toEqual({ name: '맑은콩나물국', allergens: [5, 6] })
    expect(formatted.origin).toEqual({})
    expect(formatted.nutrition).toEqual({})
  })
})

describe('페이지네이션 처리', () => {
  test('1000개 이상 데이터 처리', async () => {
    const largeMealSchema = expect.arrayContaining([
      expect.objectContaining({
        date: expect.any(String),
        meals: expect.arrayContaining([
          expect.objectContaining({
            type: expect.any(String),
            typeCode: expect.any(Number),
            menu: expect.arrayContaining([
              expect.objectContaining({
                name: expect.any(String),
                allergens: expect.any(Array),
              }),
            ]),
            headCount: expect.any(Number),
            origin: expect.any(Object),
            calorie: expect.any(Number),
            nutrition: expect.any(Object),
          }),
        ]),
      }),
    ])

    const response = await request(app).get('/api/v1/meal').query({
      province: 'J10',
      school: '7530539',
      startDate: '2022-01-01',
      endDate: '2025-01-01',
    })

    expect(response.status).toBe(200)
    expect(response.type).toBe('application/json')
    expect(Array.isArray(response.body)).toBe(true)
    expect(response.body).toEqual(largeMealSchema)
    expect(response.body.length).toBe(1096)

    // 날짜 순서
    const dates = response.body.map((item: MealResponse[number]) => item.date)
    expect(dates).toEqual([...dates].sort())
  })
})
