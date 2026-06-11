export type PrisonerSearchResponse = { alerts: prisonerAlert[]; prisonerNumber: string }

export interface RestPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

type prisonerAlert = {
  alertType: string
  alertCode: string
  active: boolean
  expired: boolean
}
