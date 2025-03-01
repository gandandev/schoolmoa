import { describe, test, expect, afterAll, afterEach, beforeAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import type { Request, Response } from 'express'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from './meal'
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
