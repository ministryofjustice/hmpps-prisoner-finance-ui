import { buildPaginationItems, calculateFirstResult, calculateLastResult } from './mojPaginationHelper'

describe('calculateFirstResult', () => {
  it('should return 0 for 1 page with 0 results', () => {
    const result = calculateFirstResult({
      pageNumber: 1,
      totalElements: 0,
      pageSize: 25,
    })
    expect(result).toBe(0)
  })

  it('should return 1 for 1 page with 1 result', () => {
    const result = calculateFirstResult({
      pageNumber: 1,
      totalElements: 1,
      pageSize: 25,
    })
    expect(result).toBe(1)
  })

  it('should return page size + 1 for page 2 ', () => {
    const result = calculateFirstResult({
      pageNumber: 2,
      totalElements: 50,
      pageSize: 25,
    })
    expect(result).toBe(26)
  })
})

describe('calculateLastResult', () => {
  it('should return total elements if on last page', () => {
    expect(
      calculateLastResult({
        pageNumber: 1,
        totalElements: 0,
        isLastPage: true,
        pageSize: 25,
      }),
    ).toBe(0)

    expect(
      calculateLastResult({
        pageNumber: 1,
        totalElements: 13,
        isLastPage: true,
        pageSize: 25,
      }),
    ).toBe(13)

    expect(
      calculateLastResult({
        pageNumber: 5,
        totalElements: 101,
        isLastPage: true,
        pageSize: 25,
      }),
    ).toBe(101)
  })

  it('should return last result number for that page when not on the last page', () => {
    expect(
      calculateLastResult({
        pageNumber: 3,
        totalElements: 125,
        isLastPage: false,
        pageSize: 25,
      }),
    ).toBe(75)
  })
})

describe('mojPaginationHelper', () => {
  it('Should generate a pagination object with zero results', () => {
    const result = buildPaginationItems({
      pageNumber: 1,
      totalPages: 1,
      totalElements: 0,
      content: [],
      isLastPage: true,
      pageSize: 25,
    })

    expect(result.items).toEqual([{ href: '?page=1', selected: true, text: '1' }])
    expect(result.previous).toBeNull()
    expect(result.next).toBeNull()
    expect(result.results).toEqual({ count: 0, from: 0, text: 'Showing 0 to 0 of 0 total results', to: 0 })
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
    expect(result.previous).toBeNull()
    expect(result.next).toBeNull()
    expect(result.results).toEqual({
      count: 1,
      from: 1,
      to: 1,
      text: 'Showing 1 to 1 of 1 total results',
    })
  })

  it('Should generate a pagintation object with 3 pages', () => {
    const result = buildPaginationItems({
      pageNumber: 1,
      totalPages: 3,
      totalElements: 75,
      content: [],
      isLastPage: false,
      pageSize: 25,
    })

    expect(result.items).toEqual([
      {
        text: '1',
        href: '?page=1',
        selected: true,
      },
      {
        text: '2',
        href: '?page=2',
        selected: false,
      },
      {
        text: '3',
        href: '?page=3',
        selected: false,
      },
    ])
    expect(result.previous).toBeNull()
    expect(result.next.text).toBe('Next')
    expect(result.next.href).toBe('?page=2')
    expect(result.results).toEqual({
      count: 75,
      from: 1,
      to: 25,
      text: 'Showing 1 to 25 of 75 total results',
    })
  })

  // Handle 4 pages
  it('Should generate a pagintation object with 4 pages', () => {
    // We should expect to see 1,2,3,4 not 1,2,3,...,4
    const result = buildPaginationItems({
      pageNumber: 1,
      totalPages: 4,
      totalElements: 100,
      content: [],
      isLastPage: false,
      pageSize: 25,
    })

    expect(result.items).toEqual([
      {
        text: '1',
        href: '?page=1',
        selected: true,
      },
      {
        text: '2',
        href: '?page=2',
        selected: false,
      },
      {
        text: '3',
        href: '?page=3',
        selected: false,
      },
      {
        text: '4',
        href: '?page=4',
        selected: false,
      },
    ])
    expect(result.previous).toBeNull()
    expect(result.next.text).toBe('Next')
    expect(result.next.href).toBe('?page=2')
    expect(result.results).toEqual({
      count: 100,
      from: 1,
      to: 25,
      text: 'Showing 1 to 25 of 100 total results',
    })
  })

  // Handle 5 pages with a ellipses
  it('Should generate a pagintation object with 5 pages', () => {
    // We should expect to see 1,2,3,...,5
    const result = buildPaginationItems({
      pageNumber: 1,
      totalPages: 5,
      totalElements: 125,
      content: [],
      isLastPage: false,
      pageSize: 25,
    })

    expect(result.items).toEqual([
      {
        text: '1',
        href: '?page=1',
        selected: true,
      },
      {
        text: '2',
        href: '?page=2',
        selected: false,
      },
      {
        text: '3',
        href: '?page=3',
        selected: false,
      },
      {
        type: 'dots',
      },
      {
        text: '5',
        href: '?page=5',
        selected: false,
      },
    ])
    expect(result.previous).toBeNull()
    expect(result.next.text).toBe('Next')
    expect(result.next.href).toBe('?page=2')
    expect(result.results).toEqual({
      count: 125,
      from: 1,
      to: 25,
      text: 'Showing 1 to 25 of 125 total results',
    })
  })

  // ellipses in front of our position
  it('Should generate a pagintation object with 5 pages when on page 4', () => {
    // We should expect to see 1,...,3,4,5
    const result = buildPaginationItems({
      pageNumber: 4,
      totalPages: 5,
      totalElements: 125,
      content: [],
      isLastPage: false,
      pageSize: 25,
    })

    expect(result.items).toEqual([
      {
        text: '1',
        href: '?page=1',
        selected: false,
      },
      {
        type: 'dots',
      },
      {
        text: '3',
        href: '?page=3',
        selected: false,
      },
      {
        text: '4',
        href: '?page=4',
        selected: true,
      },
      {
        text: '5',
        href: '?page=5',
        selected: false,
      },
    ])
    expect(result.previous.text).toBe('Previous')
    expect(result.previous.href).toBe('?page=3')
    expect(result.next.text).toBe('Next')
    expect(result.next.href).toBe('?page=5')
    expect(result.results).toEqual({
      count: 125,
      from: 76,
      to: 100,
      text: 'Showing 76 to 100 of 125 total results',
    })
  })

  // ellipses in fron and behind our position
  it('Should generate a pagintation object with elipses on both sides of the middle section when it doesnt contain the first or last page', () => {
    // We should expect to see 1,...,3,4,5,...7
    const result = buildPaginationItems({
      pageNumber: 4,
      totalPages: 7,
      totalElements: 175,
      content: [],
      isLastPage: false,
      pageSize: 25,
    })

    expect(result.items).toEqual([
      {
        text: '1',
        href: '?page=1',
        selected: false,
      },
      {
        type: 'dots',
      },
      {
        text: '3',
        href: '?page=3',
        selected: false,
      },
      {
        text: '4',
        href: '?page=4',
        selected: true,
      },
      {
        text: '5',
        href: '?page=5',
        selected: false,
      },
      {
        type: 'dots',
      },
      {
        text: '7',
        href: '?page=7',
        selected: false,
      },
    ])
    expect(result.previous.text).toBe('Previous')
    expect(result.previous.href).toBe('?page=3')
    expect(result.next.text).toBe('Next')
    expect(result.next.href).toBe('?page=5')
    expect(result.results).toEqual({
      count: 175,
      from: 76,
      to: 100,
      text: 'Showing 76 to 100 of 175 total results',
    })
  })
})
