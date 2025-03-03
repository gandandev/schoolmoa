import { describe, test, expect } from 'vitest'
import { handleNeisStatus } from './neis'

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
