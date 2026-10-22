export interface PrisonerAdvanceResponse {
  id: string
  legacyPaymentProfileId: number
  legacyInformationNumber: string
  prisonNumber: string
  prisonID: string
  amount: number
  createdOn: string
  repaymentStartDate: string
  repaymentAmount: number
  reference: string
  comment: string
  createdBy: string
  status: string
  updatedAt: string
  generalLedgerUUID: string
}
