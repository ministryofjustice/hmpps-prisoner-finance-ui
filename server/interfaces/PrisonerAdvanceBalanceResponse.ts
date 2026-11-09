export interface PrisonerAdvanceBalanceResponse {
  balanceDateTime: string
  advanceAmount: number
  balanceOutstanding: number
  weeklyPaymentAmount: number
  remainingPayments: number
  nextPaymentDate: string
  status: string
}

export interface PrisonerTotalAdvanceBalanceResponse {
  balanceDateTime: string
  advancesAmount: number
  balancesOutstanding: number
  weeklyPaymentAmount: number
}
