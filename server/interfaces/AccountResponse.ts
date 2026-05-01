type SubAccountResponse = {
  id: string
  reference: string
  createdBy: string
  createdAt: string
  parentAccountId: string
}

export default interface AccountResponse {
  id: string
  reference: string
  createdBy: string
  createdAt: string
  type: 'PRISON' | 'PRISONER'
  subAccounts: SubAccountResponse[]
}
