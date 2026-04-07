import { buildPaginationItems } from './mojPaginationHelper'

describe('mojPaginationHelper', () => {
  it('Should generate a pagination object with zero results', () => {
    const result = buildPaginationItems({
      pageNumber: 0,
      totalPages: 0,
      totalElements: 0,
      content: [],
      isLastPage: false,
      pageSize: 25,
    })

    expect(result.items).toEqual([])

    expect(result.previous).toBeUndefined()
    expect(result.next).toBeUndefined()
    expect(result.results).toBeUndefined()
  })

  it('Should generate a pagintation object with 1 result item', () => {
    const result = buildPaginationItems({
      pageNumber: 1,
      totalPages: 1,
      totalElements: 1,
      content: [],
      isLastPage: true,
      pageSize: 25,
    })

    expect(result.items).toEqual([
      {
        text: '1',
        href: '?page=1',
        selected: true,
      },
    ])
    expect(result.previous).toBeUndefined()
    expect(result.next).toBeUndefined()
    expect(result.results).toEqual({
      count: 1,
      from: 1,
      to: 1,
      text: 'Showing 1 to 1 of 1 total results',
    })
  })
})
