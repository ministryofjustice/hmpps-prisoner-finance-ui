export interface PrisonerHoldResponse {
  id: string
  prisonNumber: string
  legacyHoldNumber: number
  subAccountRef: string
  createdAt: string
  createdBy: string
  holdFromDate: string
  holdUntilDate: string
  isReleased: boolean
  description: string | null
  holdType: string
  amount: number
  holdLocation: string
}
