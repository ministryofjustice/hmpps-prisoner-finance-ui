export interface PrisonerSearchResult {
  totalElements: number
  totalPages: number
  size: number
  content: PrisonerSearchContent[]
  number: number
  first: boolean
  last: boolean
  sort: {
    empty: boolean
    sorted: boolean
    unsorted: boolean
  }
  numberOfElements: number
  pageable: {
    offset: number
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    pageSize: number
    paged: boolean
    pageNumber: number
    unpaged: boolean
  }
  empty: boolean
}

export interface PrisonerSearchContent {
  prisonerNumber: string
  title: string
  firstName: string
  middleNames: string
  lastName: string
  dateOfBirth: string
  currentFacialImageId: number
  status: string
  inOutStatus: string
  prisonId: string
  prisonName: string
  lastPrisonId: string
  previousPrisonId: string
  cellLocation: string
  currentIncentive: {
    level: {
      code: string
      description: string
    }
    dateTime: string
    nextReviewDate: string
  }
}
