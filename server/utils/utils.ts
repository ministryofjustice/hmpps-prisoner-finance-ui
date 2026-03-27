import { format, parseISO } from 'date-fns'
import config from '../config'
import { PrisonRegisterName } from '../interfaces/prisonRegisterName'

const properCase = (word: string): string =>
  word.length >= 1 ? word[0].toUpperCase() + word.toLowerCase().slice(1) : word

const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(properCase).join('-'))

export const penceToPound = (pence: number): string => {
  if (pence === null || Number.isNaN(pence)) {
    return 'NaN'
  }

  const sign = pence < 0 ? '-' : ''
  const abs = Math.abs(pence)

  const pounds = Math.floor(abs / 100)
  const remainder = abs % 100

  const pennies = remainder.toString().padStart(2, '0')

  return `£${sign}${pounds}.${pennies}`
}

export const formatDateForView = (utcString: string): string => {
  return format(parseISO(utcString), 'dd/MM/yyyy')
}

export const convertToTitleCase = (sentence: string): string =>
  isBlank(sentence) ? '' : sentence.split(' ').map(properCaseName).join(' ')

export const initialiseName = (fullName?: string): string | null => {
  // this check is for the authError page
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

type TabContent = {
  tabName: string
  href: string
}

const baseUrlPrisonerProfile = config.prisoner_profile_url
export const createProfileTabsForPrisoner = ({ prisonNumber }: { prisonNumber: string }): TabContent[] => {
  return [
    { tabName: 'Overview', href: `${baseUrlPrisonerProfile}/prisoner/${prisonNumber}` },
    { tabName: 'Personal', href: `${baseUrlPrisonerProfile}/prisoner/${prisonNumber}/personal` },
    { tabName: 'Case notes', href: `${baseUrlPrisonerProfile}/prisoner/${prisonNumber}/case-notes` },
    { tabName: 'Alerts', href: `${baseUrlPrisonerProfile}/prisoner/${prisonNumber}/alerts/active` },
    { tabName: 'Offences', href: `${baseUrlPrisonerProfile}/prisoner/${prisonNumber}/offences` },
    { tabName: 'Work and skills', href: `${baseUrlPrisonerProfile}/prisoner/${prisonNumber}/work-and-skills` },
    { tabName: 'Finances', href: `/prisoner/${prisonNumber}/money` },
  ]
}

export const convertPrisonIdToName = (prisonId: string, prisonNames: PrisonRegisterName[]): string => {
  const res = prisonNames.find(prison => prison.prisonId === prisonId)?.prisonName ?? prisonId
  return res
}
