export interface PrisonerSubscriptionResponse {
  id: string
  legacyPaymentProfileId: number
  amount: number
  dayOfPayment: string
  startDate: string
  endDate: string | null
  subscriptionType: string
  reference: string
  createdBy: string
  createdAt: string
  prisonId: string
  prisonNumber: string
  subAccountRef: string
}
