import { describe, test, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import type { Request, Response } from 'express'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from './meal'

const app = express()
app.get('/api/v1/meal', (req: Request, res: Response) => {
  handler(req as VercelRequest, res as unknown as VercelResponse)
})

describe('하루 급식 조회', () => {
  test('정상 요청 (중식)', async () => {
    const response = await request(app).get('/api/v1/meal').query({
      province: 'D10', // 대구광역시
      school: '7261044', // 대구대성초등학교
      date: '2024-03-20',
    })

    expect(response.status).toBe(200)
    expect(response.type).toBe('application/json')
    expect(response.body).toEqual([
      {
        date: '2024-03-20',
        meals: [
          {
            type: '중식',
            typeCode: 2,
            menu: [
              { name: '맑은콩나물국', allergens: [5, 6] },
              { name: '지코바치밥', allergens: [1, 2, 5, 12, 15] },
              { name: '교자만두/부추겉절이', allergens: [1, 5, 6, 10, 13, 15, 16, 18] },
              { name: '깍두기', allergens: [9] },
              { name: '우유(급식)', allergens: [2] },
              { name: '마시는애플망고', allergens: [13] },
            ],
            headCount: 206,
            origin: {
              '쇠고기(종류)': '국내산(한우)',
              '쇠고기 식육가공품': '국내산',
              돼지고기: '국내산',
              '돼지고기 식육가공품': '국내산',
              닭고기: '국내산',
              '닭고기 식육가공품': '국내산',
              오리고기: '국내산',
              '오리고기 가공품': '국내산',
              쌀: '국내산',
              배추: '국내산',
              고춧가루: '국내산',
              콩: '국내산',
              낙지: '국내산',
              고등어: '국내산',
              갈치: '국내산',
              오징어: '국내산',
              꽃게: '국내산',
              참조기: '국내산',
              비고: '',
            },
            calorie: 596.5,
            nutrition: {
              탄수화물: '75.1g',
              단백질: '30.9g',
              지방: '17.8g',
              비타민A: '119.6R.E',
              티아민: '0.4mg',
              리보플라빈: '0.4mg',
              비타민C: '9.1mg',
              칼슘: '625.1mg',
              철분: '4.2mg',
            },
          },
        ],
      },
    ])
  })

  test('정상 요청 (조식, 중식)', async () => {
    const response = await request(app).get('/api/v1/meal').query({
      province: 'B10', // 서울특별시
      school: '7010084', // 서울과학고등학교
      date: '2024-03-15',
    })

    expect(response.status).toBe(200)
    expect(response.type).toBe('application/json')
    expect(response.body).toEqual([
      {
        date: '2024-03-15',
        meals: [
          {
            type: '조식',
            typeCode: 1,
            menu: [
              { name: '*찹쌀밥', allergens: [] },
              { name: '감자옹심이', allergens: [5, 6, 16, 17] },
              { name: '*콩나물무침(과)', allergens: [5] },
              { name: '*진미채조림', allergens: [1, 5, 6, 13, 17] },
              { name: '돈육양송이볶음(과)', allergens: [10, 13] },
              { name: '*배추겉절이(완)', allergens: [9] },
              { name: '브라우니', allergens: [1, 2, 5, 6] },
              { name: '*요구르트', allergens: [2] },
            ],
            headCount: 240,
            origin: {
              '쇠고기(종류)': '국내산(한우)',
              '쇠고기 식육가공품': '국내산',
              돼지고기: '국내산',
              '돼지고기 식육가공품': '외국산(립)',
              닭고기: '국내산',
              '닭고기 식육가공품': '국내산',
              오리고기: '국내산',
              '오리고기 가공품': '국내산',
              쌀: '국내산',
              배추: '국내산',
              고춧가루: '국내산',
              콩: '국내산',
              '콩 가공품': '국내산',
              낙지: '국내산or 중국or베트남',
              명태: '러시아',
              고등어: '국내산',
              갈치: '국내산or세네갈',
              오징어: '국내산',
              꽃게: '국내산',
              참조기: '국내산',
              주꾸미: '국내산or베트남',
            },
            calorie: 741.8,
            nutrition: {
              탄수화물: '117.8g',
              단백질: '30.1g',
              지방: '15.7g',
              비타민A: '30.3R.E',
              티아민: '0.6mg',
              리보플라빈: '0.3mg',
              비타민C: '9.1mg',
              칼슘: '820.3mg',
              철분: '1.8mg',
            },
          },
          {
            type: '중식',
            typeCode: 2,
            menu: [
              { name: '*참치김치밥버거', allergens: [1, 5, 9, 13, 16, 18] },
              { name: '*복주머니유부국', allergens: [1, 5, 6, 9, 10, 13, 16] },
              { name: '*순대', allergens: [2, 5, 6, 10, 13, 16] },
              { name: '*로제떡볶이(과)', allergens: [1, 2, 5, 6, 10, 12, 13, 15, 16] },
              { name: '*꼬들단무지(과)', allergens: [] },
              { name: '샤인머스캣', allergens: [] },
              { name: '*양상추샐러드(과)', allergens: [1, 5, 6, 12] },
            ],
            headCount: 463,
            origin: {
              '쇠고기(종류)': '국내산(한우)',
              '쇠고기 식육가공품': '국내산',
              돼지고기: '국내산',
              '돼지고기 식육가공품': '외국산(립)',
              닭고기: '국내산',
              '닭고기 식육가공품': '국내산',
              오리고기: '국내산',
              '오리고기 가공품': '국내산',
              쌀: '국내산',
              배추: '국내산',
              고춧가루: '국내산',
              콩: '국내산',
              '콩 가공품': '국내산',
              낙지: '국내산or 중국or베트남',
              명태: '러시아',
              고등어: '국내산',
              갈치: '국내산or세네갈',
              오징어: '국내산',
              꽃게: '국내산',
              참조기: '국내산',
              주꾸미: '국내산or베트남',
            },
            calorie: 982.8,
            nutrition: {
              탄수화물: '177.8g',
              단백질: '31.7g',
              지방: '17.1g',
              비타민A: '108.2R.E',
              티아민: '0.7mg',
              리보플라빈: '0.6mg',
              비타민C: '29.8mg',
              칼슘: '898.8mg',
              철분: '6.4mg',
            },
          },
        ],
      },
    ])
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
    expect(response.body).toEqual({
      error: {
        code: 400,
        message: '쿼리가 누락되었습니다.',
      },
    })
  })

  test('쿼리의 형식이 잘못된 경우', async () => {
    const response = await request(app).get('/api/v1/meal').query({
      province: 'Hello, world!',
      school: 'ABCD',
      date: '안녕하세요',
    })

    expect(response.status).toBe(400)
    expect(response.type).toBe('application/json')
    expect(response.body).toEqual({
      error: {
        code: 400,
        message: '쿼리의 형식이 잘못되었습니다.',
      },
    })
  })
})
