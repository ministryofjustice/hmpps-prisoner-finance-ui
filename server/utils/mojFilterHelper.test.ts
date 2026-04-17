import { ParsedQs } from 'qs'
import { buildMojSelectedFilter, SelectedFilterItem } from './mojFilterHelper'

describe('buildMojSelectedFilter', () => {
  it('Should exclude filters from hrefs', () => {
    const filtersConfig = {
      startDate: { label: 'Start date', category: 'Date' },
      endDate: { label: 'End date', category: 'Date' },
      otherDate: { label: 'Other date', category: 'Date' },
    }
    const elementATextToQueryParam: Record<string, string> = {
      'Start Date': 'startDate',
      'End Date': 'endDate',
      'Other Date': 'otherDate',
    }
    const queryParamDoesNotIncludeItself = (item: SelectedFilterItem) =>
      !item.href.includes(`=${elementATextToQueryParam[item.text]}`)

    const mockQuery: ParsedQs = {
      startDate: '02/02/02',
      endDate: '01/01/01',
      otherDate: '03/02/01',
    }

    const res = buildMojSelectedFilter(filtersConfig, mockQuery)

    expect(res.find(el => el.heading.text === 'Date').items.length).toBe(3)
    const { items } = res[0]

    expect(items.every(queryParamDoesNotIncludeItself)).toBe(true)
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

  it('Should exclude false debit and credit from selectedFilters', () => {
    const filtersConfig = {
      startDate: { label: 'Start date', category: 'Date' },
      endDate: { label: 'End date', category: 'Date' },
      debit: { label: 'Debit', category: 'Debit and Credit' },
      credit: { label: 'Credit', category: 'Debit and Credit' },
    }

    const mockQuery: ParsedQs = {
      startDate: '02/02/02',
      endDate: '01/01/01',
      debit: 'false',
      credit: 'false',
    }

    const res = buildMojSelectedFilter(filtersConfig, mockQuery)

    expect(res.filter(el => el.heading.text === 'Debit and Credit').length).toBe(0)
    expect(res.find(el => el.heading.text === 'Date').items.length).toBe(2)
  })

  it('Should include true debit and credit from selectedFilters', () => {
    const filtersConfig = {
      startDate: { label: 'Start date', category: 'Date' },
      endDate: { label: 'End date', category: 'Date' },
      debit: { label: 'Debit', category: 'Debit and Credit' },
      credit: { label: 'Credit', category: 'Debit and Credit' },
    }

    const mockQuery: ParsedQs = {
      startDate: '02/02/02',
      endDate: '01/01/01',
      debit: 'true',
      credit: 'true',
    }

    const res = buildMojSelectedFilter(filtersConfig, mockQuery)

    expect(res.find(el => el.heading.text === 'Debit and Credit').items.length).toBe(2)
    expect(res.find(el => el.heading.text === 'Date').items.length).toBe(2)
  })

  it('Should include invalid debit and credit from selectedFilters so that they can be cleared', () => {
    const filtersConfig = {
      startDate: { label: 'Start date', category: 'Date' },
      endDate: { label: 'End date', category: 'Date' },
      debit: { label: 'Debit', category: 'Debit and Credit' },
      credit: { label: 'Credit', category: 'Debit and Credit' },
    }

    const mockQuery: ParsedQs = {
      startDate: '02/02/02',
      endDate: '01/01/01',
      debit: 'XXXX',
      credit: 'XXXX',
    }

    const res = buildMojSelectedFilter(filtersConfig, mockQuery)

    expect(res.find(el => el.heading.text === 'Debit and Credit').items.length).toBe(2)
    expect(res.find(el => el.heading.text === 'Date').items.length).toBe(2)
  })
})
