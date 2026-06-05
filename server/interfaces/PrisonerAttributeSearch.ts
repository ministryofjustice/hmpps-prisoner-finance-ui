export type AttributeSearchResponse = { alerts: []; prisonerNumber: string }
// TODO: get rid of this and use the findByPrisonId
type Matcher = {
  attribute: string
  type: string
  condition: string
  searchTerm: string
}

type AttributeQuery = {
  matchers: Matcher[]
}

export type AttributeSearch = {
  queries: AttributeQuery[]
}

export interface RestPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}
