import { ParsedQs } from 'qs'
import { buildMojSelectedFilter } from './mojFilterHelper'

describe('buildMojSelectedFilter', () => {
  it('Should exclude filters from hrefs', () => {
    const filtersConfig = {
      startDate: { label: 'Start date', category: 'Date' },
      endDate: { label: 'End date', category: 'Date' },
      otherDate: { label: 'Other date', category: 'Date' },
    }

    const reverseParamMap = Object.fromEntries(Object.entries(filtersConfig).map(([key, value]) => [value.label, key]))

    const mockQuery: ParsedQs = {
      startDate: '02/02/02',
      endDate: '01/01/01',
      otherDate: '03/02/01',
    }

    const res = buildMojSelectedFilter(filtersConfig, mockQuery)

    expect(res.find(el => el.heading.text === 'Date').items.length).toBe(3)
    expect(res[0].items.every(item => !item.href.includes(`=${reverseParamMap[item.text]}`))).toBeTruthy()
  })

  it('Should group filters by Category', () => {
    const filtersConfig = {
      startDate: { label: 'Start date', category: 'Date' },
      endDate: { label: 'End date', category: 'Date' },
      otherDate: { label: 'Other date', category: 'Date' },
      transactionId: { label: 'Transaction Id', category: 'Transaction' },
    }

    const mockQuery: ParsedQs = {
      startDate: '02/02/02',
      endDate: '01/01/01',
      otherDate: '03/02/01',
      transactionId: '123',
    }

    const res = buildMojSelectedFilter(filtersConfig, mockQuery)

    expect(res.find(el => el.heading.text === 'Date').items.length).toBe(3)
    expect(res.find(el => el.heading.text === 'Transaction').items.length).toBe(1)
  })

  it('Should exclude filters that are not in the query string', () => {
    const filtersConfig = {
      startDate: { label: 'Start date', category: 'Date' },
      endDate: { label: 'End date', category: 'Date' },
      otherDate: { label: 'Other date', category: 'Date' },
      transactionId: { label: 'Transaction Id', category: 'Transaction' },
    }

    const mockQuery: ParsedQs = {
      startDate: '02/02/02',
      endDate: '01/01/01',
      transactionId: '123',
    }

    const res = buildMojSelectedFilter(filtersConfig, mockQuery)

    expect(res.find(el => el.heading.text === 'Date').items.length).toBe(2)
    expect(res.find(el => el.heading.text === 'Transaction').items.length).toBe(1)
  })
})
