/**
 * 나이스 API 기본 응답 형식
 * @param T 응답 데이터 타입
 */
export type NeisResponseBase<T> = [
  {
    head: [
      {
        list_total_count: number
      },
      {
        RESULT: NeisStatus
      },
    ]
  },
  {
    row: T[]
  },
]

/**
 * 나이스 API 오류 응답 형식
 * @param RESULT 상태 코드
 */
export type NeisErrorOnlyResponse = {
  RESULT: NeisStatus
}

/**
 * 모든 나이스 API 상태 코드
 */
export type NeisStatus = {
  CODE:
    | 'INFO-000'
    | 'INFO-100'
    | 'INFO-200'
    | 'INFO-300'
    | 'ERROR-000'
    | 'ERROR-290'
    | 'ERROR-300'
    | 'ERROR-310'
    | 'ERROR-333'
    | 'ERROR-336'
    | 'ERROR-337'
    | 'ERROR-500'
    | 'ERROR-600'
    | 'ERROR-601'
  MESSAGE: string
}

/**
 * 나이스 급식식단정보 API 응답 형식
 */
export type NeisMealResponse =
  | {
      mealServiceDietInfo: NeisResponseBase<NeisMealResponseRow>
    }
  | NeisErrorOnlyResponse

/**
 * 급식 응답 형식 행
 */
export type NeisMealResponseRow = {
  ATPT_OFCDC_SC_CODE: string
  ATPT_OFCDC_SC_NM: string
  SD_SCHUL_CODE: string
  SCHUL_NM: string
  MMEAL_SC_CODE: string
  MMEAL_SC_NM: string
  MLSV_YMD: string
  MLSV_FGR: number
  DDISH_NM: string
  ORPLC_INFO: string
  CAL_INFO: string
  NTR_INFO: string
  MLSV_FROM_YMD: string
  MLSV_TO_YMD: string
  LOAD_DTM: string
}
