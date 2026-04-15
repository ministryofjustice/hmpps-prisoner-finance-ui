import { z } from 'zod'
import { transactionsFilterSchema } from '../validators/transactionsFilterValidator'

type PaginationItem =
  | {
      text: string
      href: string
      selected: boolean
    }
  | {
      type: 'dots'
    }

type PaginationResult<T> = {
  items: PaginationItem[]
  previous: { text: string; href: string } | null
  next: { text: string; href: string } | null
  results: {
    count: number
    from: number
    to: number
    text: string
  }
  content: T[]
  pageNumber: number
  totalPages: number
  totalElements: number
  isLastPage: boolean
  pageSize: number
}

type BuildPaginationItemsParams<T> = {
  pageNumber: number
  totalPages: number
  totalElements: number
  content: T[]
  isLastPage: boolean
  pageSize: number
  filters: z.infer<typeof transactionsFilterSchema>
}

const stringifyFilters = (filters: z.infer<typeof transactionsFilterSchema>) =>
  Object.fromEntries(Object.entries(filters).map(([key, val]) => [key, String(val)]))

const MAX_VISIBLE_WITHOUT_DOTS = 7

export default function buildPaginationItems<T>({
  pageNumber,
  totalPages,
  totalElements,
  content,
  isLastPage,
  pageSize,
  filters,
}: BuildPaginationItemsParams<T>): PaginationResult<T> {
  const items = buildPageItems(pageNumber, totalPages, filters)
  const previous = buildPreviousLink(pageNumber, filters)
  const next = buildNextLink(pageNumber, totalPages, filters)
  const results = buildResultsSummary(pageNumber, pageSize, totalElements)
  return {
    items,
    previous,
    next,
    results,
    content,
    pageNumber,
    totalPages,
    totalElements,
    isLastPage,
    pageSize,
  }
}

function buildPageItems(
  pageNumber: number,
  totalPages: number,
  filters: z.infer<typeof transactionsFilterSchema>,
): PaginationItem[] {
  if (totalPages <= MAX_VISIBLE_WITHOUT_DOTS) {
    return createPageRange(1, totalPages, pageNumber, filters)
  }

  if (pageNumber === 1) {
    return [
      createPageItem(1, pageNumber, filters),
      createPageItem(2, pageNumber, filters),
      createDotsItem(),
      createPageItem(totalPages, pageNumber, filters),
    ]
  }

  if (pageNumber === totalPages) {
    return [
      createPageItem(1, pageNumber, filters),
      createDotsItem(),
      createPageItem(totalPages - 1, pageNumber, filters),
      createPageItem(totalPages, pageNumber, filters),
    ]
  }

  const visiblePages = getVisiblePages(pageNumber, totalPages)
  return buildItemsFromPages(visiblePages, pageNumber, filters)
}

function getVisiblePages(pageNumber: number, totalPages: number): number[] {
  const visiblePages = new Set<number>([1, totalPages, pageNumber - 1, pageNumber, pageNumber + 1])

  if (pageNumber <= 4) {
    addPageRange(visiblePages, 1, pageNumber + 1)
  }

  if (pageNumber >= totalPages - 3) {
    addPageRange(visiblePages, pageNumber - 1, totalPages)
  }

  return Array.from(visiblePages)
    .filter(page => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
}

function buildItemsFromPages(
  pages: number[],
  selectedPage: number,
  filters: z.infer<typeof transactionsFilterSchema>,
): PaginationItem[] {
  const items: PaginationItem[] = []

  for (let index = 0; index < pages.length; index += 1) {
    const currentPage = pages[index]
    const previousPage = pages[index - 1]

    if (shouldInsertDots(previousPage, currentPage)) {
      items.push(createDotsItem())
    }

    items.push(createPageItem(currentPage, selectedPage, filters))
  }

  return items
}

function shouldInsertDots(previousPage: number | undefined, currentPage: number): boolean {
  return previousPage !== undefined && currentPage - previousPage >= 2
}

function createPageRange(
  from: number,
  to: number,
  selectedPage: number,
  filters: z.infer<typeof transactionsFilterSchema>,
): PaginationItem[] {
  const items: PaginationItem[] = []

  for (let page = from; page <= to; page += 1) {
    items.push(createPageItem(page, selectedPage, filters))
  }

  return items
}

function addPageRange(target: Set<number>, from: number, to: number): void {
  for (let page = from; page <= to; page += 1) {
    target.add(page)
  }
}

function createPageItem(
  page: number,
  selectedPage: number,
  filters: z.infer<typeof transactionsFilterSchema>,
): PaginationItem {
  const pageString = page.toString()
  const stringifiedFilters = stringifyFilters(filters)
  const filtersWithPage: Record<string, string> = { ...stringifiedFilters, page: pageString }
  const queryString = new URLSearchParams(filtersWithPage)

  return {
    text: String(page),
    href: `?${queryString}`,
    selected: page === selectedPage,
  }
}

function createDotsItem(): PaginationItem {
  return { type: 'dots' }
}

function buildPreviousLink(
  pageNumber: number,
  filters: z.infer<typeof transactionsFilterSchema>,
): { text: string; href: string } | null {
  if (pageNumber <= 1) {
    return null
  }

  const pageString = (pageNumber - 1).toString()
  const stringifiedFilters = stringifyFilters(filters)
  const filtersWithPage: Record<string, string> = { ...stringifiedFilters, page: pageString }
  const queryString = new URLSearchParams(filtersWithPage)

  return {
    text: 'Previous',
    href: `?${queryString}`,
  }
}

function buildNextLink(
  pageNumber: number,
  totalPages: number,
  filters: z.infer<typeof transactionsFilterSchema>,
): { text: string; href: string } | null {
  if (pageNumber >= totalPages) {
    return null
  }
  const pageString = (pageNumber + 1)?.toString()
  const stringifiedFilters = stringifyFilters(filters)
  const filtersWithPage: Record<string, string> = { ...stringifiedFilters, page: pageString }
  const queryString = new URLSearchParams(filtersWithPage)

  return {
    text: 'Next',
    href: `?${queryString}`,
  }
}

function buildResultsSummary(
  pageNumber: number,
  pageSize: number,
  totalElements: number,
): PaginationResult<unknown>['results'] {
  const from = totalElements === 0 ? 0 : (pageNumber - 1) * pageSize + 1
  const to = totalElements === 0 ? 0 : Math.min(pageNumber * pageSize, totalElements)

  return {
    count: totalElements,
    from,
    to,
    text: ` results`,
  }
}
