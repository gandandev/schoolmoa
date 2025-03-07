import type { NeisMealResponseRow, NeisMealResponse } from '../../../types/neis'
import { differenceInDays } from 'date-fns'

function generatePagedMockData(
  pageIndex: number,
  pageSize: number,
  startDate: string,
  endDate: string,
  mealTypesInADay: {
    code: 1 | 2 | 3
    type: '조식' | '중식' | '석식'
  }[],
  {
    provinceCode,
    provinceName,
    schoolCode,
    schoolName,
    headCount,
    meal,
    origin,
    calorie,
    nutrition,
  }: {
    provinceCode: string
    provinceName: string
    schoolCode: string
    schoolName: string
    headCount: number
    meal: string
    origin: string
    calorie: number
    nutrition: string
  },
): NeisMealResponse {
  // YYYYMMDD 형식으로는 Date 객체를 생성할 수 없어 YYYY-MM-DD 형식으로 변환
  const formattedStartDate = startDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
  const formattedEndDate = endDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')

  const daysBetweenDates = Math.abs(differenceInDays(new Date(formattedStartDate), new Date(formattedEndDate)))
  const totalCount = Math.max(1, daysBetweenDates * mealTypesInADay.length)

  const dataRow: NeisMealResponseRow[] = []
  const itemsToGenerate = Math.min(pageSize, totalCount - (pageIndex - 1) * pageSize)

  for (let i = 0; i < itemsToGenerate; i++) {
    const itemIndex = (pageIndex - 1) * pageSize + i
    const dayOffset = Math.floor(itemIndex / mealTypesInADay.length)
    const currentDate = new Date(formattedStartDate)
    currentDate.setDate(currentDate.getDate() + dayOffset)
    const formattedDate = currentDate.toISOString().slice(0, 10).replace(/-/g, '')

    dataRow.push({
      ATPT_OFCDC_SC_CODE: provinceCode,
      ATPT_OFCDC_SC_NM: provinceName,
      SD_SCHUL_CODE: schoolCode,
      SCHUL_NM: schoolName,
      MMEAL_SC_CODE: mealTypesInADay[itemIndex % mealTypesInADay.length].code.toString(),
      MMEAL_SC_NM: mealTypesInADay[itemIndex % mealTypesInADay.length].type,
      MLSV_YMD: formattedDate,
      MLSV_FGR: headCount,
      DDISH_NM: meal,
      ORPLC_INFO: origin,
      CAL_INFO: `${calorie} Kcal`,
      NTR_INFO: nutrition,
      MLSV_FROM_YMD: startDate,
      MLSV_TO_YMD: endDate,
      LOAD_DTM: endDate,
    })
  }

  return {
    mealServiceDietInfo: [
      {
        head: [{ list_total_count: totalCount }, { RESULT: { CODE: 'INFO-000', MESSAGE: '정상 처리되었습니다.' } }],
      },
      {
        row: dataRow,
      },
    ],
  }
}

const longMockData = (pageIndex: number) =>
  generatePagedMockData(
    pageIndex,
    1000,
    '20220101',
    '20250101',
    [
      { code: 1, type: '조식' },
      { code: 2, type: '중식' },
    ],
    {
      provinceCode: 'J10',
      provinceName: '경기도교육청',
      schoolCode: '7530539',
      schoolName: '한국조리과학고등학교',
      headCount: 879,
      meal: '현미밥 <br/>고기된장찌개3 (5.6.9.16.18)<br/>야채계란찜 (1.9.13)<br/>연탄불고기 (10)<br/>배추겉절이** (9)<br/>요구르트 (2)<br/>앙버터모닝빵 (1.2.5.6)',
      origin:
        '쇠고기(종류) : 국내산(한우)<br/>쇠고기 식육가공품 : 국내산<br/>돼지고기 : 국내산<br/>돼지고기 식육가공품 : 국내산<br/>닭고기 : <br/>닭고기 식육가공품 : <br/>오리고기 : <br/>오리고기 가공품 : <br/>쌀 : 국내산<br/>배추 : 국내산<br/>고춧가루 : 국내산<br/>콩 : 국내산<br/>낙지 : <br/>고등어 : <br/>갈치 : <br/>오징어 : <br/>꽃게 : <br/>참조기 : <br/>비고 : ',
      calorie: 897.1,
      nutrition:
        '탄수화물(g) : 118.0<br/>단백질(g) : 55.4<br/>지방(g) : 20.4<br/>비타민A(R.E) : 156.4<br/>티아민(mg) : 1.2<br/>리보플라빈(mg) : 0.7<br/>비타민C(mg) : 18.0<br/>칼슘(mg) : 1249.9<br/>철분(mg) : 4.6',
    },
  )

export const mockDataMap = {
  // 대구대성초등학교 2024-03-20
  'D10:7261044:20240320:1:1000': {
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
  'B10:7010084:20240315:1:1000': {
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
  'T10:9290079:20250120:1:1000': {
    RESULT: { CODE: 'INFO-200', MESSAGE: '해당하는 데이터가 없습니다.' },
  },

  // 정라초등학교 2024-03-18 ~ 2024-03-22
  'K10:7872032:20240318:20240322:1:1000': {
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

  // 한국조리과학고등학교 2022-01-01~2025-01-01
  'J10:7530539:20220101:20250101:1:1000': longMockData(1),
  'J10:7530539:20220101:20250101:2:1000': longMockData(2),
  'J10:7530539:20220101:20250101:3:1000': longMockData(3),
}

// 에러 응답 데이터
export const errorResponses = {
  missingParams: {
    RESULT: { CODE: 'ERROR-300', MESSAGE: '필수 값이 누락되었습니다.' },
  },
}
