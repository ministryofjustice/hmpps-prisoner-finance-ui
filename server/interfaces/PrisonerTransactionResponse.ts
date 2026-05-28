export interface PrisonerTransactionResponse {
  date: string
  description: string
  credit: number
  debit: number
  location: string
  accountType: string
  subAccountBalance: number | null
  accountBalance: number | null
}
