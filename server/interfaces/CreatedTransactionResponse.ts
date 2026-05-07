export default interface CreatedTransactionResponse {
  reference: string
  description: string
  timestamp: string
  amount: string
  entrySequence: number
  postings: CreatedTransactionPostingResponse[]
}

export interface CreatedTransactionPostingResponse {
  subAccountId: string
  type: PostingType
  amount: number
  entrySequence: number
}

export type PostingType = 'CR' | 'DR'
