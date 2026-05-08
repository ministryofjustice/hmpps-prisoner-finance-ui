export default interface CreatedTransactionResponse {
  id: string
  createdBy: string
  createdAt: string
  reference: string
  description: string
  timestamp: string
  amount: number
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
