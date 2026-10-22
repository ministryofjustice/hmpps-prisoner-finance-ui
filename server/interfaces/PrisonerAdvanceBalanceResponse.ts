export interface PrisonerAdvanceBalanceResponse {
  balanceDateTime: string
  advanceAmount: number
  balanceOutstanding: number
  weeklyPaymentAmount: number
  remainingPayments: number
  nextPaymentDate: string
}

export interface PrisonerAdvancesBalanceResponse {
  balanceDateTime: string
  advancesAmount: number
  balancesOutstanding: number
  weeklyPaymentAmount: number
}
