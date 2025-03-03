import { describe, test, expect } from 'vitest'
import { validateDate, validateDefaultQueries } from './validation'

describe('날짜 형식 확인', () => {
  test('올바른 형식 (YYYY-MM-DD)', () => {
    expect(validateDate('2024-03-20')).toBe(true)
  })

  test('올바른 형식 (YYYYMMDD)', () => {
    expect(validateDate('20240320')).toBe(true)
  })

  test('잘못된 형식', () => {
    expect(validateDate('2024-03-20T12:00:00')).toBe(false)
    expect(validateDate('2024/03/20')).toBe(false)
    expect(validateDate('2024.03.20')).toBe(false)
  })

  test('날짜가 아님', () => {
    expect(validateDate('ㅁㄴㅇㄹ')).toBe(false)
    expect(validateDate('')).toBe(false)
  })
})

describe('쿼리 유효성 검사', () => {
  test('모든 필드가 유효한 경우 (단일 날짜)', () => {
    expect(
      validateDefaultQueries('B10', '7010084', {
        date: '2024-03-15',
        startDate: undefined,
        endDate: undefined,
      }),
    ).toBe(true)
  })

  test('모든 필드가 유효한 경우 (날짜 범위)', () => {
    expect(
      validateDefaultQueries('K10', '7872032', {
        date: undefined,
        startDate: '2024-03-18',
        endDate: '2024-03-22',
      }),
    ).toBe(true)
  })

  test('필수 필드가 누락된 경우', () => {
    expect(
      validateDefaultQueries('', '7010084', {
        date: '2024-03-15',
        startDate: undefined,
        endDate: undefined,
      }),
    ).toBe(false)

    expect(
      validateDefaultQueries('B10', '', {
        date: '2024-03-15',
        startDate: undefined,
        endDate: undefined,
      }),
    ).toBe(false)
  })

  test('날짜 필드가 누락된 경우', () => {
    expect(
      validateDefaultQueries('B10', '7010084', {
        date: undefined,
        startDate: undefined,
        endDate: undefined,
      }),
    ).toBe(false)
  })

  test('날짜 범위 중 하나만 있는 경우', () => {
    expect(
      validateDefaultQueries('B10', '7010084', {
        date: undefined,
        startDate: '2024-03-18',
        endDate: undefined,
      }),
    ).toBe(false)

    expect(
      validateDefaultQueries('B10', '7010084', {
        date: undefined,
        startDate: undefined,
        endDate: '2024-03-22',
      }),
    ).toBe(false)
  })

  test('단일 날짜와 날짜 범위가 동시에 있는 경우', () => {
    expect(
      validateDefaultQueries('B10', '7010084', {
        date: '2024-03-15',
        startDate: '2024-03-18',
        endDate: '2024-03-22',
      }),
    ).toBe(false)
  })

  test('시작일이 종료일보다 늦은 경우', () => {
    expect(
      validateDefaultQueries('B10', '7010084', {
        date: undefined,
        startDate: '2024-03-22',
        endDate: '2024-03-18',
      }),
    ).toBe(false)
  })

  test('잘못된 형식의 필드', () => {
    expect(
      validateDefaultQueries('B1', '7010084', {
        date: '2024-03-15',
        startDate: undefined,
        endDate: undefined,
      }),
    ).toBe(false)

    expect(
      validateDefaultQueries('B10', 'ABC', {
        date: '2024-03-15',
        startDate: undefined,
        endDate: undefined,
      }),
    ).toBe(false)

    expect(
      validateDefaultQueries('B10', '7010084', {
        date: '2024/03/15',
        startDate: undefined,
        endDate: undefined,
      }),
    ).toBe(false)
  })
})
