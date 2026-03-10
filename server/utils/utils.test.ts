import { convertToTitleCase, initialiseName, penceToPound, formatDateForView } from './utils'

describe('penceToPound', () => {
  it.each([
    { input: 0, expected: '£0.00' },
    { input: 1, expected: '£0.01' },
    { input: 10, expected: '£0.10' },
    { input: 99, expected: '£0.99' },
    { input: 123456, expected: '£1234.56' },
    { input: -250, expected: '£-2.50' },
    { input: null, expected: 'NaN' },
    { input: NaN, expected: 'NaN' },
  ])('converts $input pence to $expected', ({ input, expected }) => {
    expect(penceToPound(input)).toBe(expected)
  })
})

describe('formatDate', () => {
  it('Convert to date to correct format', () => {
    expect(formatDateForView('2026-03-10T10:43:28.094Z')).toBe('10/03/2026')
  })
})

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})
