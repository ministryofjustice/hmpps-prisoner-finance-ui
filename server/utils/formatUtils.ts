import { format, isValid, parseISO } from 'date-fns'

const uniformWhitespace = (word: string): string => (word ? word.trim().replace(/\s+/g, ' ') : '')

export const lastNameCommaFirstName = (person: { firstName: string; lastName: string }): string => {
  if (!person) return ''
  return `${uniformWhitespace(person.lastName)}, ${uniformWhitespace(person.firstName)}`.replace(/(^, )|(, $)/, '')
}

export const firstNameSpaceLastName = (person: { firstName: string; lastName: string }): string => {
  if (!person) return ''
  return `${uniformWhitespace(person.firstName)} ${uniformWhitespace(person.lastName)}`.trim()
}

export const formatDate = (date?: string | Date, fmt = 'd MMMM yyyy') => {
  if (!date) return undefined
  const richDate = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(richDate)) return undefined
  return format(richDate, fmt)
}
