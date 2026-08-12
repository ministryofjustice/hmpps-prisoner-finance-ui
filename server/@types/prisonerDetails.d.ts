export default interface PrisonerDetails {
  prisonerNumber: string
  lastName: string
  firstName: string
  dateOfBirth: string
  prisonName?: string | undefined
  cellLocation?: string | undefined
  prisonId?: string
  bookingId?: string | undefined
  csra?: string | undefined
  currentIncentiveLevelDescription?: string | undefined
  category?: string | undefined
}
