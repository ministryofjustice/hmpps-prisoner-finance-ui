import { PostingType } from './CreatedTransactionResponse'

export type CreateBatchTransactionFormRequest = {
  caseloadId: string
  caseloadSubAccountRef: string
  postingType: PostingType
  controlAmount: number
  description: string
  prisonNumbersPostings: PrisonerPosting[]
}

type PrisonerPosting = {
  prisonNumber: string
  postingType: PostingType
  prisonerSubAccountRef: string
  amount: number
}
