/**
 * 나이스 API 상태 코드 처리
 * @param status 상태 코드
 * @returns 알맞는 API 응답 내용
 */
export function handleNeisStatus(status: string) {
  if (status === 'INFO-000') return null
  if (status === 'INFO-200') return { status: 200, body: [] }

  const statusMap = {
    'ERROR-300': { code: 400, message: '쿼리가 누락되었습니다.' },
    'ERROR-337': { code: 429, message: '오늘 호출 횟수를 초과했습니다.' },
  }

  const mappedStatus = statusMap[status] || { code: 500, message: '데이터를 불러오는 데 실패했습니다.' }
  return {
    status: mappedStatus.code,
    body: {
      error: {
        code: mappedStatus.code,
        message: mappedStatus.message,
      },
    },
  }
}
