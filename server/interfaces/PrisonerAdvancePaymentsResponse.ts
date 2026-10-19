export interface PrisonerAdvancePaymentsResponse {
  id: string
  transactionId: string
  prisonNumber: string
  legacyAdvanceNumber: number
  createdAt: string
  createdBy: string
  date: string
  paymentAmount: number
  advanceLocation: string
}
