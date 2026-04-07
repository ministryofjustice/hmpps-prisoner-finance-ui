import { Page } from '../interfaces/Pageable'

export interface mojPagination {
  items: (mojPaginationItem | mojPaginationDots)[]
  results?: mojPaginationResult
  previous?: mojPaginationArrowItem
  next?: mojPaginationArrowItem
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
  type: 'dots'
}

/*
const buildItems = (count: number) => {
   
    for()
        text: string,
        href: string,
        selected: boolean,

}
*/

export const buildPaginationItems = <T>(pageObject: Page<T>): mojPagination => {
  if (pageObject.totalElements === 0) {
    return {
      items: [],
    }
  }
  return {
    items: [
      {
        text: '1',
        href: '?page=1',
        selected: true,
      },
    ],
    results: {
      count: 1,
      from: 1,
      to: 1,
      text: 'Showing 1 to 1 of 1 total results',
    },
  }
}
