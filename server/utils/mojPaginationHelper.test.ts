import { z } from 'zod'
import buildPaginationItems from './mojPaginationHelper'
import { transactionsFilterSchema } from '../validators/transactionsFilterValidator'

describe('buildPaginationItems', () => {
  const buildPage = ({
    pageNumber,
    totalPages,
    totalElements = totalPages * 25,
    filters = {},
  }: {
    pageNumber: number
    totalPages: number
    totalElements?: number
    filters?: z.infer<typeof transactionsFilterSchema>
  }) =>
    buildPaginationItems({
      pageNumber,
      totalPages,
      totalElements,
      content: [],
      isLastPage: pageNumber === totalPages,
      pageSize: 25,
      filters,
    })

  describe('when all pages can be shown without ellipses', () => {
    it('should show all pages and include previous, next and results for a middle page', () => {
      const result = buildPage({ pageNumber: 3, totalPages: 5 })

      expect(result.items).toEqual([
        { text: '1', href: '?page=1', selected: false },
        { text: '2', href: '?page=2', selected: false },
        { text: '3', href: '?page=3', selected: true },
        { text: '4', href: '?page=4', selected: false },
        { text: '5', href: '?page=5', selected: false },
      ])

      expect(result.previous).toEqual({
        text: 'Previous',
        href: '?page=2',
      })

      expect(result.next).toEqual({
        text: 'Next',
        href: '?page=4',
      })

      expect(result.results).toEqual({
        count: 125,
        from: 51,
        to: 75,
        text: ' results',
      })
    })

    it('should show all pages and include previous, next and results when there are 7 pages', () => {
      const result = buildPage({ pageNumber: 4, totalPages: 7 })

      expect(result.items).toEqual([
        { text: '1', href: '?page=1', selected: false },
        { text: '2', href: '?page=2', selected: false },
        { text: '3', href: '?page=3', selected: false },
        { text: '4', href: '?page=4', selected: true },
        { text: '5', href: '?page=5', selected: false },
        { text: '6', href: '?page=6', selected: false },
        { text: '7', href: '?page=7', selected: false },
      ])

      expect(result.previous).toEqual({
        text: 'Previous',
        href: '?page=3',
      })

      expect(result.next).toEqual({
        text: 'Next',
        href: '?page=5',
      })

      expect(result.results).toEqual({
        count: 175,
        from: 76,
        to: 100,
        text: ' results',
      })
    })
  })

  describe('when the selected page is at the start', () => {
    it('should show the first page, the next page, ellipses, and the last page, with no previous link', () => {
      const result = buildPage({ pageNumber: 1, totalPages: 8 })

      expect(result.items).toEqual([
        { text: '1', href: '?page=1', selected: true },
        { text: '2', href: '?page=2', selected: false },
        { type: 'dots' },
        { text: '8', href: '?page=8', selected: false },
      ])

      expect(result.previous).toBeNull()

      expect(result.next).toEqual({
        text: 'Next',
        href: '?page=2',
      })

      expect(result.results).toEqual({
        count: 200,
        from: 1,
        to: 25,
        text: ' results',
      })
    })

    it('should show all pages when only one page exists after it, with no previous link', () => {
      const result = buildPage({ pageNumber: 1, totalPages: 3 })

      expect(result.items).toEqual([
        { text: '1', href: '?page=1', selected: true },
        { text: '2', href: '?page=2', selected: false },
        { text: '3', href: '?page=3', selected: false },
      ])

      expect(result.previous).toBeNull()

      expect(result.next).toEqual({
        text: 'Next',
        href: '?page=2',
      })

      expect(result.results).toEqual({
        count: 75,
        from: 1,
        to: 25,
        text: ' results',
      })
    })
  })

  describe('when the selected page is one in from the start', () => {
    it('should show one page either side, then ellipses, then the last page, with previous and next links', () => {
      const result = buildPage({ pageNumber: 2, totalPages: 8 })

      expect(result.items).toEqual([
        { text: '1', href: '?page=1', selected: false },
        { text: '2', href: '?page=2', selected: true },
        { text: '3', href: '?page=3', selected: false },
        { type: 'dots' },
        { text: '8', href: '?page=8', selected: false },
      ])

      expect(result.previous).toEqual({
        text: 'Previous',
        href: '?page=1',
      })

      expect(result.next).toEqual({
        text: 'Next',
        href: '?page=3',
      })

      expect(result.results).toEqual({
        count: 200,
        from: 26,
        to: 50,
        text: ' results',
      })
    })
  })

  describe('when the selected page is in the middle', () => {
    it('should show first page, ellipses, one page either side, ellipses, and last page, with previous and next links', () => {
      const result = buildPage({ pageNumber: 5, totalPages: 10 })

      expect(result.items).toEqual([
        { text: '1', href: '?page=1', selected: false },
        { type: 'dots' },
        { text: '4', href: '?page=4', selected: false },
        { text: '5', href: '?page=5', selected: true },
        { text: '6', href: '?page=6', selected: false },
        { type: 'dots' },
        { text: '10', href: '?page=10', selected: false },
      ])

      expect(result.previous).toEqual({
        text: 'Previous',
        href: '?page=4',
      })

      expect(result.next).toEqual({
        text: 'Next',
        href: '?page=6',
      })

      expect(result.results).toEqual({
        count: 250,
        from: 101,
        to: 125,
        text: ' results',
      })
    })
  })

  describe('when the selected page is one in from the end', () => {
    it('should show first page, ellipses, one page before, selected page, and last page', () => {
      const result = buildPage({ pageNumber: 7, totalPages: 8 })

      expect(result.items).toEqual([
        { text: '1', href: '?page=1', selected: false },
        { type: 'dots' },
        { text: '6', href: '?page=6', selected: false },
        { text: '7', href: '?page=7', selected: true },
        { text: '8', href: '?page=8', selected: false },
      ])

      expect(result.previous).toEqual({
        text: 'Previous',
        href: '?page=6',
      })

      expect(result.next).toEqual({
        text: 'Next',
        href: '?page=8',
      })

      expect(result.results).toEqual({
        count: 200,
        from: 151,
        to: 175,
        text: ' results',
      })
    })
  })

  describe('when the selected page is at the end', () => {
    it('should show first page, ellipses, the previous page, and the last page', () => {
      const result = buildPage({ pageNumber: 8, totalPages: 8 })

      expect(result.items).toEqual([
        { text: '1', href: '?page=1', selected: false },
        { type: 'dots' },
        { text: '7', href: '?page=7', selected: false },
        { text: '8', href: '?page=8', selected: true },
      ])

      expect(result.previous).toEqual({
        text: 'Previous',
        href: '?page=7',
      })

      expect(result.next).toBeNull()

      expect(result.results).toEqual({
        count: 200,
        from: 176,
        to: 200,
        text: ' results',
      })
    })
  })

  describe('when a gap is too small to justify ellipses', () => {
    it('should not use leading ellipses when the selected page is close enough to the start', () => {
      const result = buildPage({ pageNumber: 4, totalPages: 8 })

      expect(result.items).toEqual([
        { text: '1', href: '?page=1', selected: false },
        { text: '2', href: '?page=2', selected: false },
        { text: '3', href: '?page=3', selected: false },
        { text: '4', href: '?page=4', selected: true },
        { text: '5', href: '?page=5', selected: false },
        { type: 'dots' },
        { text: '8', href: '?page=8', selected: false },
      ])

      expect(result.previous).toEqual({
        text: 'Previous',
        href: '?page=3',
      })

      expect(result.next).toEqual({
        text: 'Next',
        href: '?page=5',
      })

      expect(result.results).toEqual({
        count: 200,
        from: 76,
        to: 100,
        text: ' results',
      })
    })

    it('should not use trailing ellipses when the selected page is close enough to the end', () => {
      const result = buildPage({ pageNumber: 5, totalPages: 8 })

      expect(result.items).toEqual([
        { text: '1', href: '?page=1', selected: false },
        { type: 'dots' },
        { text: '4', href: '?page=4', selected: false },
        { text: '5', href: '?page=5', selected: true },
        { text: '6', href: '?page=6', selected: false },
        { text: '7', href: '?page=7', selected: false },
        { text: '8', href: '?page=8', selected: false },
      ])

      expect(result.previous).toEqual({
        text: 'Previous',
        href: '?page=4',
      })

      expect(result.next).toEqual({
        text: 'Next',
        href: '?page=6',
      })

      expect(result.results).toEqual({
        count: 200,
        from: 101,
        to: 125,
        text: ' results',
      })
    })
  })

  describe('results summary edge cases', () => {
    it('should show zero results correctly when there are no elements', () => {
      const result = buildPage({
        pageNumber: 1,
        totalPages: 1,
        totalElements: 0,
      })

      expect(result.items).toEqual([{ text: '1', href: '?page=1', selected: true }])

      expect(result.previous).toBeNull()
      expect(result.next).toBeNull()

      expect(result.results).toEqual({
        count: 0,
        from: 0,
        to: 0,
        text: ' results',
      })
    })

    it('should cap the "to" value to total elements on the last partial page', () => {
      const result = buildPage({
        pageNumber: 3,
        totalPages: 3,
        totalElements: 61,
      })

      expect(result.items).toEqual([
        { text: '1', href: '?page=1', selected: false },
        { text: '2', href: '?page=2', selected: false },
        { text: '3', href: '?page=3', selected: true },
      ])

      expect(result.previous).toEqual({
        text: 'Previous',
        href: '?page=2',
      })

      expect(result.next).toBeNull()

      expect(result.results).toEqual({
        count: 61,
        from: 51,
        to: 61,
        text: ' results',
      })
    })
  })

  it('should appened any existing queries to the href', () => {
    const filters = { startDate: '01/01/2026', endDate: '02/01/2026' }
    const result = buildPage({
      pageNumber: 2,
      totalPages: 3,
      totalElements: 61,
      filters,
    })

    expect(result.items).toEqual([
      {
        text: '1',
        href: `?startDate=${encodeURIComponent(filters.startDate)}&endDate=${encodeURIComponent(filters.endDate)}&page=1`,
        selected: false,
      },
      {
        text: '2',
        href: `?startDate=${encodeURIComponent(filters.startDate)}&endDate=${encodeURIComponent(filters.endDate)}&page=2`,
        selected: true,
      },
      {
        text: '3',
        href: `?startDate=${encodeURIComponent(filters.startDate)}&endDate=${encodeURIComponent(filters.endDate)}&page=3`,
        selected: false,
      },
    ])
    expect(result.next.href).toEqual(
      `?startDate=${encodeURIComponent(filters.startDate)}&endDate=${encodeURIComponent(filters.endDate)}&page=3`,
    )
    expect(result.previous.href).toEqual(
      `?startDate=${encodeURIComponent(filters.startDate)}&endDate=${encodeURIComponent(filters.endDate)}&page=1`,
    )
  })
})
