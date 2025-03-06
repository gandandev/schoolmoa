import { VercelRequest, VercelResponse } from '@vercel/node'
import 'dotenv/config'
import { validateDefaultQueries } from './validation'
import { NeisResponseBase } from '../types/neis'
import { handleNeisStatus } from './neis'

/**
 * API 핸들러 생성
 * @param T 나이스 API 응답 행 타입
 * @param neisApiName 나이스 API 이름
 * @param pageSize 한 API 요청 시 가져올 데이터 수
 * @returns express 기반 API 핸들러
 */
export function createApiHandler<T>(
  {
    neisApiName,
    groupData,
    formatData,
  }: {
    neisApiName: string
    groupData?: (data: T[]) => Record<string, T[]>
    formatData?: (data: T[] | Record<string, T[]>) => object | object[]
  },
  { pageSize = 1000 }: { pageSize?: number },
) {
  return async function handler(request: VercelRequest, response: VercelResponse) {
    const { province, school, date, startDate, endDate } = request.query

    try {
      if (!process.env.NEIS_API_KEY) throw new Error('NEIS_API_KEY is not defined')

      // 쿼리 검증
      if (
        !validateDefaultQueries(province, school, {
          date,
          startDate,
          endDate,
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
        pSize: String(pageSize),
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

      const fetchPage = async (
        pageIndex: number,
      ): Promise<NeisResponseBase<T, typeof neisApiName extends string ? typeof neisApiName : never> | null> => {
        const pageParams = new URLSearchParams(params)
        if (pageIndex > 1) {
          pageParams.set('pIndex', pageIndex.toString())
        }

        return fetch(`https://open.neis.go.kr/hub/${neisApiName}?${pageParams.toString()}`)
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
        neisApiName in firstPageResult
          ? firstPageResult[neisApiName][0].head[1].RESULT.CODE
          : 'CODE' in firstPageResult.RESULT
            ? firstPageResult.RESULT.CODE
            : null // 나이스 API의 문제
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
      const totalCount = firstPageResult[neisApiName][0].head[0].list_total_count
      const totalPages = Math.ceil(totalCount / pageSize)

      let allData = [...firstPageResult[neisApiName][1].row]

      // 페이지가 더 필요할 경우 병렬로 가져오기
      if (totalPages > 1) {
        const additionalPagePromises: Promise<NeisResponseBase<
          T,
          typeof neisApiName extends string ? typeof neisApiName : never
        > | null>[] = []

        for (let pageIndex = 2; pageIndex <= totalPages; pageIndex++) {
          additionalPagePromises.push(fetchPage(pageIndex))
        }

        const additionalPageResults = await Promise.all(additionalPagePromises)

        // 데이터 합치기
        for (const pageResult of additionalPageResults) {
          if (pageResult && neisApiName in pageResult) {
            allData = [...allData, ...pageResult[neisApiName][1].row]
          }
        }
      }

      const groupedData = groupData?.(allData) ?? allData
      const processedData = formatData?.(groupedData) ?? groupedData

      response.status(200).json(processedData)
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
}
