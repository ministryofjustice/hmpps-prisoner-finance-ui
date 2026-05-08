export default interface TransactionRequest {
  creditSubAccountId: string
  debitSubAccountId: string
  amount: number
  description: string
}
