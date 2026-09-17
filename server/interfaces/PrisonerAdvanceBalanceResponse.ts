export interface PrisonerAdvanceBalanceResponse {
  balanceDateTime: string
  amount: number
  outstandingAmount: number
  weeklyAmount: number
  paymentsRemaining: number
  nextPaymentDate: string
}
