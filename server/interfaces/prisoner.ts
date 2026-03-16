export interface Prisoner {
  firstName: string
  lastName: string
  prisonerNumber: string
  prisonId: string
  status: string
  cellLocation: string
  category: string
  csra: string
  currentIncentive: {
    level: {
      code: string
      description: string
    }
  }
}
