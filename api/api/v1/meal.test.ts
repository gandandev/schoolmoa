import { describe, test, expect, afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import request from 'supertest'
import express from 'express'
import type { Request, Response } from 'express'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from './meal'

// 나이스 API mock 데이터
// province:school:date 또는 province:school:startDate:endDate
const mockDataMap = {
  // 대구대성초등학교 2024-03-20
  'D10:7261044:20240320': {
    mealServiceDietInfo: [
      { head: [{ list_total_count: 1 }, { RESULT: { CODE: 'INFO-000', MESSAGE: '정상 처리되었습니다.' } }] },
      {
        row: [
          {
            ATPT_OFCDC_SC_CODE: 'D10',
            ATPT_OFCDC_SC_NM: '대구광역시교육청',
            SD_SCHUL_CODE: '7261044',
            SCHUL_NM: '대구대성초등학교',
            MMEAL_SC_CODE: '2',
            MMEAL_SC_NM: '중식',
            MLSV_YMD: '20240320',
            MLSV_FGR: 206,
            DDISH_NM:
              '맑은콩나물국 (5.6)<br/>지코바치밥 (1.2.5.12.15)<br/>교자만두/부추겉절이 (1.5.6.10.13.15.16.18)<br/>깍두기 (9)<br/>우유(급식) (2)<br/>마시는애플망고 (13)',
            ORPLC_INFO:
              '쇠고기(종류) : 국내산(한우)<br/>쇠고기 식육가공품 : 국내산<br/>돼지고기 : 국내산<br/>돼지고기 식육가공품 : 국내산<br/>닭고기 : 국내산<br/>닭고기 식육가공품 : 국내산<br/>오리고기 : 국내산<br/>오리고기 가공품 : 국내산<br/>쌀 : 국내산<br/>배추 : 국내산<br/>고춧가루 : 국내산<br/>콩 : 국내산<br/>낙지 : 국내산<br/>고등어 : 국내산<br/>갈치 : 국내산<br/>오징어 : 국내산<br/>꽃게 : 국내산<br/>참조기 : 국내산<br/>비고 : ',
            CAL_INFO: '596.5 Kcal',
            NTR_INFO:
              '탄수화물(g) : 75.1<br/>단백질(g) : 30.9<br/>지방(g) : 17.8<br/>비타민A(R.E) : 119.6<br/>티아민(mg) : 0.4<br/>리보플라빈(mg) : 0.4<br/>비타민C(mg) : 9.1<br/>칼슘(mg) : 625.1<br/>철분(mg) : 4.2',
            MLSV_FROM_YMD: '20240320',
            MLSV_TO_YMD: '20240320',
            LOAD_DTM: '20240327',
          },
        ],
      },
    ],
  },

  // 서울과학고등학교 2024-03-15
  'B10:7010084:20240315': {
    mealServiceDietInfo: [
      { head: [{ list_total_count: 2 }, { RESULT: { CODE: 'INFO-000', MESSAGE: '정상 처리되었습니다.' } }] },
      {
        row: [
          {
            ATPT_OFCDC_SC_CODE: 'B10',
            ATPT_OFCDC_SC_NM: '서울특별시교육청',
            SD_SCHUL_CODE: '7010084',
            SCHUL_NM: '서울과학고등학교',
            MMEAL_SC_CODE: '1',
            MMEAL_SC_NM: '조식',
            MLSV_YMD: '20240315',
            MLSV_FGR: 240,
            DDISH_NM:
              '*찹쌀밥 <br/>감자옹심이 (5.6.16.17)<br/>*콩나물무침(과) (5)<br/>*진미채조림 (1.5.6.13.17)<br/>돈육양송이볶음(과) (10.13)<br/>*배추겉절이(완) (9)<br/>브라우니 (1.2.5.6)<br/>*요구르트 (2)',
            ORPLC_INFO:
              '쇠고기(종류) : 국내산(한우)<br/>쇠고기 식육가공품 : 국내산<br/>돼지고기 : 국내산<br/>돼지고기 식육가공품 : 외국산(립)<br/>닭고기 : 국내산<br/>닭고기 식육가공품 : 국내산<br/>오리고기 : 국내산<br/>오리고기 가공품 : 국내산<br/>쌀 : 국내산<br/>배추 : 국내산<br/>고춧가루 : 국내산<br/>콩 : 국내산<br/>콩 가공품 : 국내산<br/>낙지 : 국내산or 중국or베트남<br/>명태 : 러시아<br/>고등어 : 국내산<br/>갈치 : 국내산or세네갈<br/>오징어 : 국내산<br/>꽃게 : 국내산<br/>참조기 : 국내산<br/>주꾸미 : 국내산or베트남',
            CAL_INFO: '741.8 Kcal',
            NTR_INFO:
              '탄수화물(g) : 117.8<br/>단백질(g) : 30.1<br/>지방(g) : 15.7<br/>비타민A(R.E) : 30.3<br/>티아민(mg) : 0.6<br/>리보플라빈(mg) : 0.3<br/>비타민C(mg) : 9.1<br/>칼슘(mg) : 820.3<br/>철분(mg) : 1.8',
            MLSV_FROM_YMD: '20240315',
            MLSV_TO_YMD: '20240315',
            LOAD_DTM: '20240322',
          },
          {
            ATPT_OFCDC_SC_CODE: 'B10',
            ATPT_OFCDC_SC_NM: '서울특별시교육청',
            SD_SCHUL_CODE: '7010084',
            SCHUL_NM: '서울과학고등학교',
            MMEAL_SC_CODE: '2',
            MMEAL_SC_NM: '중식',
            MLSV_YMD: '20240315',
            MLSV_FGR: 463,
            DDISH_NM:
              '*참치김치밥버거 (1.5.9.13.16.18)<br/>*복주머니유부국 (1.5.6.9.10.13.16)<br/>*순대 (2.5.6.10.13.16)<br/>*로제떡볶이(과) (1.2.5.6.10.12.13.15.16)<br/>*꼬들단무지(과) <br/>샤인머스캣 <br/>*양상추샐러드(과) (1.5.6.12)',
            ORPLC_INFO:
              '쇠고기(종류) : 국내산(한우)<br/>쇠고기 식육가공품 : 국내산<br/>돼지고기 : 국내산<br/>돼지고기 식육가공품 : 외국산(립)<br/>닭고기 : 국내산<br/>닭고기 식육가공품 : 국내산<br/>오리고기 : 국내산<br/>오리고기 가공품 : 국내산<br/>쌀 : 국내산<br/>배추 : 국내산<br/>고춧가루 : 국내산<br/>콩 : 국내산<br/>콩 가공품 : 국내산<br/>낙지 : 국내산or 중국or베트남<br/>명태 : 러시아<br/>고등어 : 국내산<br/>갈치 : 국내산or세네갈<br/>오징어 : 국내산<br/>꽃게 : 국내산<br/>참조기 : 국내산<br/>주꾸미 : 국내산or베트남',
            CAL_INFO: '982.8 Kcal',
            NTR_INFO:
              '탄수화물(g) : 177.8<br/>단백질(g) : 31.7<br/>지방(g) : 17.1<br/>비타민A(R.E) : 108.2<br/>티아민(mg) : 0.7<br/>리보플라빈(mg) : 0.6<br/>비타민C(mg) : 29.8<br/>칼슘(mg) : 898.8<br/>철분(mg) : 6.4',
            MLSV_FROM_YMD: '20240315',
            MLSV_TO_YMD: '20240315',
            LOAD_DTM: '20240322',
          },
        ],
      },
    ],
  },

  // 제주제일고등학교부설방송통신고등학교 2025-01-20 (데이터 없음)
  'T10:9290079:20250120': {
    RESULT: { CODE: 'INFO-200', MESSAGE: '해당하는 데이터가 없습니다.' },
  },

  // 정라초등학교 2024-03-18 ~ 2024-03-22
  'K10:7872032:20240318:20240322': {
    mealServiceDietInfo: [
      { head: [{ list_total_count: 5 }, { RESULT: { CODE: 'INFO-000', MESSAGE: '정상 처리되었습니다.' } }] },
      {
        row: [
          {
            ATPT_OFCDC_SC_CODE: 'K10',
            ATPT_OFCDC_SC_NM: '강원특별자치도교육청',
            SD_SCHUL_CODE: '7872032',
            SCHUL_NM: '정라초등학교',
            MMEAL_SC_CODE: '2',
            MMEAL_SC_NM: '중식',
            MLSV_YMD: '20240318',
            MLSV_FGR: 621,
            DDISH_NM:
              '잡곡밥 (5)<br/>쇠고기우거지국 (5.6.13.16)<br/>계란장조림 (1.5.6.13.18)<br/>어수리나물 <br/>임연수구이 (5.6)<br/>배추김치 (9)<br/>하루견과 ',
            ORPLC_INFO:
              '쇠고기(종류) : 국내산(한우)<br/>쇠고기 식육가공품 : 국내산<br/>돼지고기 : 국내산<br/>돼지고기 식육가공품 : 국내산<br/>닭고기 : 국내산<br/>닭고기 식육가공품 : 국내산<br/>오리고기 : 국내산<br/>오리고기 가공품 : 국내산<br/>쌀 : 국내산<br/>배추 : 국내산<br/>고춧가루 : 국내산<br/>콩 : 국내산<br/>낙지 : 국내산<br/>고등어 : 국내산<br/>갈치 : 국내산<br/>오징어 : 국내산<br/>꽃게 : 국내산<br/>참조기 : 국내산<br/>비고 : ',
            CAL_INFO: '580.6 Kcal',
            NTR_INFO:
              '탄수화물(g) : 69.5<br/>단백질(g) : 29.8<br/>지방(g) : 20.2<br/>비타민A(R.E) : 65.3<br/>티아민(mg) : 0.3<br/>리보플라빈(mg) : 0.7<br/>비타민C(mg) : 6.8<br/>칼슘(mg) : 573.6<br/>철분(mg) : 7.4',
            MLSV_FROM_YMD: '20240318',
            MLSV_TO_YMD: '20240318',
            LOAD_DTM: '20240325',
          },
          {
            ATPT_OFCDC_SC_CODE: 'K10',
            ATPT_OFCDC_SC_NM: '강원특별자치도교육청',
            SD_SCHUL_CODE: '7872032',
            SCHUL_NM: '정라초등학교',
            MMEAL_SC_CODE: '2',
            MMEAL_SC_NM: '중식',
            MLSV_YMD: '20240319',
            MLSV_FGR: 621,
            DDISH_NM:
              '버섯카로틴밥 <br/>달래된장찌개 (5.6)<br/>숙주미나리무침 <br/>제육볶음 (5.6.10.13)<br/>배추김치 (9)<br/>사과 ',
            ORPLC_INFO:
              '쇠고기(종류) : 국내산(한우)<br/>쇠고기 식육가공품 : 국내산<br/>돼지고기 : 국내산<br/>돼지고기 식육가공품 : 국내산<br/>닭고기 : 국내산<br/>닭고기 식육가공품 : 국내산<br/>오리고기 : 국내산<br/>오리고기 가공품 : 국내산<br/>쌀 : 국내산<br/>배추 : 국내산<br/>고춧가루 : 국내산<br/>콩 : 국내산<br/>낙지 : 국내산<br/>고등어 : 국내산<br/>갈치 : 국내산<br/>오징어 : 국내산<br/>꽃게 : 국내산<br/>참조기 : 국내산<br/>비고 : ',
            CAL_INFO: '536.3 Kcal',
            NTR_INFO:
              '탄수화물(g) : 72.7<br/>단백질(g) : 20.9<br/>지방(g) : 17.0<br/>비타민A(R.E) : 55.9<br/>티아민(mg) : 0.6<br/>리보플라빈(mg) : 0.3<br/>비타민C(mg) : 11.3<br/>칼슘(mg) : 694.3<br/>철분(mg) : 1.9',
            MLSV_FROM_YMD: '20240319',
            MLSV_TO_YMD: '20240319',
            LOAD_DTM: '20240326',
          },
          {
            ATPT_OFCDC_SC_CODE: 'K10',
            ATPT_OFCDC_SC_NM: '강원특별자치도교육청',
            SD_SCHUL_CODE: '7872032',
            SCHUL_NM: '정라초등학교',
            MMEAL_SC_CODE: '2',
            MMEAL_SC_NM: '중식',
            MLSV_YMD: '20240320',
            MLSV_FGR: 621,
            DDISH_NM:
              '친환경쌀하이라이스 (1.2.5.6.12.13.16.18)<br/>콩나물무채국 (5)<br/>물미역/초장 (5.6.13)<br/>소시지구이 (1.2.5.6.10.15.16)<br/>배추김치 (9)<br/>오렌지 ',
            ORPLC_INFO:
              '쇠고기(종류) : 국내산(한우)<br/>쇠고기 식육가공품 : 국내산<br/>돼지고기 : 국내산<br/>돼지고기 식육가공품 : 국내산<br/>닭고기 : 국내산<br/>닭고기 식육가공품 : 국내산<br/>오리고기 : 국내산<br/>오리고기 가공품 : 국내산<br/>쌀 : 국내산<br/>배추 : 국내산<br/>고춧가루 : 국내산<br/>콩 : 국내산<br/>낙지 : 국내산<br/>고등어 : 국내산<br/>갈치 : 국내산<br/>오징어 : 국내산<br/>꽃게 : 국내산<br/>참조기 : 국내산<br/>비고 : ',
            CAL_INFO: '548.9 Kcal',
            NTR_INFO:
              '탄수화물(g) : 92.6<br/>단백질(g) : 17.7<br/>지방(g) : 11.9<br/>비타민A(R.E) : 86.6<br/>티아민(mg) : 0.5<br/>리보플라빈(mg) : 0.3<br/>비타민C(mg) : 38.5<br/>칼슘(mg) : 1145.8<br/>철분(mg) : 2.4',
            MLSV_FROM_YMD: '20240320',
            MLSV_TO_YMD: '20240320',
            LOAD_DTM: '20240327',
          },
          {
            ATPT_OFCDC_SC_CODE: 'K10',
            ATPT_OFCDC_SC_NM: '강원특별자치도교육청',
            SD_SCHUL_CODE: '7872032',
            SCHUL_NM: '정라초등학교',
            MMEAL_SC_CODE: '2',
            MMEAL_SC_NM: '중식',
            MLSV_YMD: '20240321',
            MLSV_FGR: 621,
            DDISH_NM:
              '서리태밥 (5)<br/>백순두부짬뽕국 (5.6.9.13.17.18)<br/>영양부추들깨무침 (5.6.13)<br/>훈제오리떡볶음 (5.6.13.18)<br/>배추김치 (9)<br/>골드파인애플 ',
            ORPLC_INFO:
              '쇠고기(종류) : 국내산(한우)<br/>쇠고기 식육가공품 : 국내산<br/>돼지고기 : 국내산<br/>돼지고기 식육가공품 : 국내산<br/>닭고기 : 국내산<br/>닭고기 식육가공품 : 국내산<br/>오리고기 : 국내산<br/>오리고기 가공품 : 국내산<br/>쌀 : 국내산<br/>배추 : 국내산<br/>고춧가루 : 국내산<br/>콩 : 국내산<br/>낙지 : 국내산<br/>고등어 : 국내산<br/>갈치 : 국내산<br/>오징어 : 국내산<br/>꽃게 : 국내산<br/>참조기 : 국내산<br/>비고 : ',
            CAL_INFO: '533.3 Kcal',
            NTR_INFO:
              '탄수화물(g) : 65.9<br/>단백질(g) : 27.0<br/>지방(g) : 17.4<br/>비타민A(R.E) : 53.1<br/>티아민(mg) : 0.5<br/>리보플라빈(mg) : 0.6<br/>비타민C(mg) : 175.5<br/>칼슘(mg) : 803.2<br/>철분(mg) : 4.1',
            MLSV_FROM_YMD: '20240321',
            MLSV_TO_YMD: '20240321',
            LOAD_DTM: '20240328',
          },
          {
            ATPT_OFCDC_SC_CODE: 'K10',
            ATPT_OFCDC_SC_NM: '강원특별자치도교육청',
            SD_SCHUL_CODE: '7872032',
            SCHUL_NM: '정라초등학교',
            MMEAL_SC_CODE: '2',
            MMEAL_SC_NM: '중식',
            MLSV_YMD: '20240322',
            MLSV_FGR: 621,
            DDISH_NM:
              '김밥볶음밥 (1.2.5.6.10.15.16)<br/>꼬치어묵국 (1.5.6)<br/>떡볶이 (1.5.6.12.13)<br/>김말이/만두튀김 (1.5.6.10.12.13.16.18)<br/>오복채무침 (5.6.13)',
            ORPLC_INFO:
              '쇠고기(종류) : 국내산(한우)<br/>쇠고기 식육가공품 : 국내산<br/>돼지고기 : 국내산<br/>돼지고기 식육가공품 : 국내산<br/>닭고기 : 국내산<br/>닭고기 식육가공품 : 국내산<br/>오리고기 : 국내산<br/>오리고기 가공품 : 국내산<br/>쌀 : 국내산<br/>배추 : 국내산<br/>고춧가루 : 국내산<br/>콩 : 국내산<br/>낙지 : 국내산<br/>고등어 : 국내산<br/>갈치 : 국내산<br/>오징어 : 국내산<br/>꽃게 : 국내산<br/>참조기 : 국내산<br/>비고 : ',
            CAL_INFO: '660.3 Kcal',
            NTR_INFO:
              '탄수화물(g) : 109.4<br/>단백질(g) : 22.8<br/>지방(g) : 14.4<br/>비타민A(R.E) : 143.6<br/>티아민(mg) : 0.3<br/>리보플라빈(mg) : 0.3<br/>비타민C(mg) : 15.1<br/>칼슘(mg) : 566.6<br/>철분(mg) : 7.5',
            MLSV_FROM_YMD: '20240322',
            MLSV_TO_YMD: '20240322',
            LOAD_DTM: '20240329',
          },
        ],
      },
    ],
  },
}

// 나이스 API Mock 설정
const server = setupServer(
  http.get('https://open.neis.go.kr/hub/mealServiceDietInfo', ({ request }) => {
    const url = new URL(request.url)
    const province = url.searchParams.get('ATPT_OFCDC_SC_CODE')
    const school = url.searchParams.get('SD_SCHUL_CODE')
    const date = url.searchParams.get('MLSV_YMD')
    const startDate = url.searchParams.get('MLSV_FROM_YMD')
    const endDate = url.searchParams.get('MLSV_TO_YMD')

    // 단일 날짜
    if (province && school && date) {
      const key = `${province}:${school}:${date}`
      if (mockDataMap[key]) {
        return HttpResponse.json(mockDataMap[key])
      }
    }

    // 날짜 범위
    if (province && school && startDate && endDate) {
      const key = `${province}:${school}:${startDate}:${endDate}`
      if (mockDataMap[key]) {
        return HttpResponse.json(mockDataMap[key])
      }
    }

    // 잘못된 쿼리 요청
    return HttpResponse.json(
      {
        RESULT: { CODE: 'ERROR-300', MESSAGE: '필수 값이 누락되었습니다.' },
      },
      { status: 400 },
    )
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

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
        message: '쿼리가 잘못되었습니다.',
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
        message: '쿼리가 잘못되었습니다.',
      },
    })
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
    expect(response.body).toEqual([
      {
        date: '2024-03-18',
        meals: [
          {
            type: '중식',
            typeCode: 2,
            menu: [
              {
                name: '잡곡밥',
                allergens: [5],
              },
              {
                name: '쇠고기우거지국',
                allergens: [5, 6, 13, 16],
              },
              {
                name: '계란장조림',
                allergens: [1, 5, 6, 13, 18],
              },
              {
                name: '어수리나물',
                allergens: [],
              },
              {
                name: '임연수구이',
                allergens: [5, 6],
              },
              {
                name: '배추김치',
                allergens: [9],
              },
              {
                name: '하루견과',
                allergens: [],
              },
            ],
            headCount: 621,
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
            calorie: 580.6,
            nutrition: {
              탄수화물: '69.5g',
              단백질: '29.8g',
              지방: '20.2g',
              비타민A: '65.3R.E',
              티아민: '0.3mg',
              리보플라빈: '0.7mg',
              비타민C: '6.8mg',
              칼슘: '573.6mg',
              철분: '7.4mg',
            },
          },
        ],
      },
      {
        date: '2024-03-19',
        meals: [
          {
            type: '중식',
            typeCode: 2,
            menu: [
              {
                name: '버섯카로틴밥',
                allergens: [],
              },
              {
                name: '달래된장찌개',
                allergens: [5, 6],
              },
              {
                name: '숙주미나리무침',
                allergens: [],
              },
              {
                name: '제육볶음',
                allergens: [5, 6, 10, 13],
              },
              {
                name: '배추김치',
                allergens: [9],
              },
              {
                name: '사과',
                allergens: [],
              },
            ],
            headCount: 621,
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
            calorie: 536.3,
            nutrition: {
              탄수화물: '72.7g',
              단백질: '20.9g',
              지방: '17g',
              비타민A: '55.9R.E',
              티아민: '0.6mg',
              리보플라빈: '0.3mg',
              비타민C: '11.3mg',
              칼슘: '694.3mg',
              철분: '1.9mg',
            },
          },
        ],
      },
      {
        date: '2024-03-20',
        meals: [
          {
            type: '중식',
            typeCode: 2,
            menu: [
              {
                name: '친환경쌀하이라이스',
                allergens: [1, 2, 5, 6, 12, 13, 16, 18],
              },
              {
                name: '콩나물무채국',
                allergens: [5],
              },
              {
                name: '물미역/초장',
                allergens: [5, 6, 13],
              },
              {
                name: '소시지구이',
                allergens: [1, 2, 5, 6, 10, 15, 16],
              },
              {
                name: '배추김치',
                allergens: [9],
              },
              {
                name: '오렌지',
                allergens: [],
              },
            ],
            headCount: 621,
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
            calorie: 548.9,
            nutrition: {
              탄수화물: '92.6g',
              단백질: '17.7g',
              지방: '11.9g',
              비타민A: '86.6R.E',
              티아민: '0.5mg',
              리보플라빈: '0.3mg',
              비타민C: '38.5mg',
              칼슘: '1145.8mg',
              철분: '2.4mg',
            },
          },
        ],
      },
      {
        date: '2024-03-21',
        meals: [
          {
            type: '중식',
            typeCode: 2,
            menu: [
              {
                name: '서리태밥',
                allergens: [5],
              },
              {
                name: '백순두부짬뽕국',
                allergens: [5, 6, 9, 13, 17, 18],
              },
              {
                name: '영양부추들깨무침',
                allergens: [5, 6, 13],
              },
              {
                name: '훈제오리떡볶음',
                allergens: [5, 6, 13, 18],
              },
              {
                name: '배추김치',
                allergens: [9],
              },
              {
                name: '골드파인애플',
                allergens: [],
              },
            ],
            headCount: 621,
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
            calorie: 533.3,
            nutrition: {
              탄수화물: '65.9g',
              단백질: '27g',
              지방: '17.4g',
              비타민A: '53.1R.E',
              티아민: '0.5mg',
              리보플라빈: '0.6mg',
              비타민C: '175.5mg',
              칼슘: '803.2mg',
              철분: '4.1mg',
            },
          },
        ],
      },
      {
        date: '2024-03-22',
        meals: [
          {
            type: '중식',
            typeCode: 2,
            menu: [
              {
                name: '김밥볶음밥',
                allergens: [1, 2, 5, 6, 10, 15, 16],
              },
              {
                name: '꼬치어묵국',
                allergens: [1, 5, 6],
              },
              {
                name: '떡볶이',
                allergens: [1, 5, 6, 12, 13],
              },
              {
                name: '김말이/만두튀김',
                allergens: [1, 5, 6, 10, 12, 13, 16, 18],
              },
              {
                name: '오복채무침',
                allergens: [5, 6, 13],
              },
            ],
            headCount: 621,
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
            calorie: 660.3,
            nutrition: {
              탄수화물: '109.4g',
              단백질: '22.8g',
              지방: '14.4g',
              비타민A: '143.6R.E',
              티아민: '0.3mg',
              리보플라빈: '0.3mg',
              비타민C: '15.1mg',
              칼슘: '566.6mg',
              철분: '7.5mg',
            },
          },
        ],
      },
    ])
  })

  test('시작일이 종료일보다 늦은 경우', async () => {
    const response = await request(app).get('/api/v1/meal').query({
      province: 'Q10', // 전라남도
      school: '8521007', // 순천연향중학교
      endDate: '2024-03-20',
    })

    expect(response.status).toBe(400)
    expect(response.type).toBe('application/json')
    expect(response.body).toEqual({
      error: {
        code: 400,
        message: '쿼리가 잘못되었습니다.',
      },
    })
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
    expect(response.body).toEqual({
      error: {
        code: 400,
        message: '쿼리가 잘못되었습니다.',
      },
    })
  })

  test('날짜 범위 중 하나만 요청한 경우', async () => {
    const response = await request(app).get('/api/v1/meal').query({
      province: 'E10', // 인천광역시
      school: '7331247', // 인천계양초등학교 상야분교장
      startDate: '2024-03-20',
    })

    expect(response.status).toBe(400)
    expect(response.type).toBe('application/json')
    expect(response.body).toEqual({
      error: {
        code: 400,
        message: '쿼리가 잘못되었습니다.',
      },
    })
  })
})
