import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { mockDataMap, errorResponses } from './mealMockData'

export const server = setupServer(
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
    return HttpResponse.json(errorResponses.missingParams, { status: 400 })
  }),
)

export const startServer = () => server.listen()
export const resetServer = () => server.resetHandlers()
export const closeServer = () => server.close()
