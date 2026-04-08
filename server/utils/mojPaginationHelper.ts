import { Page } from '../interfaces/Pageable'

export interface mojPagination {
  items: Array<mojPaginationItem | mojPaginationDots>
  results?: mojPaginationResult
  previous: mojPaginationArrowItem | null
  next: mojPaginationArrowItem | null
}

interface mojPaginationItem {
  text: string
  href: string
  selected: boolean
}

interface mojPaginationResult {
  count: number
  from: number
  to: number
  text: string
}

interface mojPaginationArrowItem {
  text: string
  href: string
}

interface mojPaginationDots {
  type: string
}

export const calculateFirstResult = ({
  pageNumber,
  pageSize,
  totalElements,
}: {
  pageNumber: number
  pageSize: number
  totalElements: number
}) => {
  const firstEntryForPage = (pageNumber - 1) * pageSize + 1
  return Math.min(firstEntryForPage, totalElements)
}

export const calculateLastResult = ({
  pageNumber,
  pageSize,
  totalElements,
  isLastPage,
}: {
  pageNumber: number
  pageSize: number
  totalElements: number
  isLastPage: boolean
}) => {
  return isLastPage ? totalElements : pageSize * pageNumber
}

export const buildPaginationItems = <T>({
  pageNumber,
  pageSize,
  totalPages,
  isLastPage,
  totalElements,
}: Page<T>): mojPagination => {
  const renderedMiddle = [pageNumber - 1, pageNumber, pageNumber + 1]

  if (pageNumber === 1) {
    renderedMiddle.push(3)
  }

  const filteredMiddle = renderedMiddle.filter(n => n > 0 && n <= totalPages)

  const items = []

  if (!filteredMiddle.includes(1)) {
    items.push({
      text: '1',
      href: '?page=1',
      selected: false,
    })

    if (totalPages > 4) {
      items.push({ type: 'dots' })
    }
  }

  filteredMiddle.forEach(n => {
    const item = {
      text: `${n}`,
      href: `?page=${n}`,
      selected: pageNumber === n,
    }
    items.push(item)
  })

  if (!filteredMiddle.includes(totalPages)) {
    if (totalPages > 4) {
      items.push({ type: 'dots' })
    }

    items.push({
      text: `${totalPages}`,
      href: `?page=${totalPages}`,
      selected: false,
    })
  }

  const from = calculateFirstResult({ pageNumber, pageSize, totalElements })
  const to = calculateLastResult({ isLastPage, pageNumber, pageSize, totalElements })

  return {
    items,
    results: {
      count: totalElements,
      from,
      to,
      text: `Showing ${from} to ${to} of ${totalElements} total results`,
    },
    next: isLastPage ? null : { text: 'Next', href: `?page=${pageNumber + 1}` },
    previous: pageNumber === 1 ? null : { text: 'Previous', href: `?page=${pageNumber - 1}` },
  }
}
