import { HoldTypeString } from './HoldTypeString'

export interface PrisonerHoldResponse {
  id: string
  prisonNumber: string
  legacyHoldNumber: number
  subAccountRef: string
  createdAt: string
  createdBy: string
  holdFromDate: string
  holdUntilDate: string | null
  isReleased: boolean
  description: string | null
  holdType: HoldTypeString
  amount: number
  holdLocation: string
}
