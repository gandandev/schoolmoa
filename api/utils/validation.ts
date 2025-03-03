export function validateDate(date: string) {
  // YYYYMMDD 또는 YYYY-MM-DD 형식
  return /^\d{4}(-\d{2}){2}$|^\d{8}$/.test(date)
}

export function validateDefaultQueries(province: string, school: string, { date, startDate, endDate }) {
  if (!province || !school) return false
  // B10, 1234567 형식
  if (!/^[BCDEFGHIJKMNPQRSTV]10$/.test(province) || !/^\d{7}$/.test(school)) return false

  // 한 날짜 또는 날짜 범위 중 하나는 반드시 있어야 함
  if (!date && (!startDate || !endDate)) return false
  if (date && (startDate || endDate)) return false

  // 날짜 형식 검증
  if (date) return validateDate(date)
  if (startDate && endDate) {
    if (!validateDate(startDate) || !validateDate(endDate)) return false

    // startDate가 endDate 이후면 안 됨
    const start = startDate.replace(/-/g, '')
    const end = endDate.replace(/-/g, '')
    return start <= end
  }

  return false
}
