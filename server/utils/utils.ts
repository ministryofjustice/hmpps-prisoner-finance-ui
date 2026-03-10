import { format, parseISO } from 'date-fns'

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
