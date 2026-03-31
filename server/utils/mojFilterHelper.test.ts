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
})
