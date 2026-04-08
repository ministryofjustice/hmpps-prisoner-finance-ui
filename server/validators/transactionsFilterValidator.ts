import { boolean, z } from 'zod'
import { parse, isValid, format } from 'date-fns'

const isValidDatePickerDate = (val: string | undefined): boolean => {
  if (val === undefined || val === '') return true
  const parsed = parse(val, 'dd/MM/yyyy', new Date())

  return isValid(parsed) && format(parsed, 'dd/MM/yyyy') === val
}

const isValidBoolean = (val: string | undefined): boolean => {
  if (val === 'true') return true
  if (val === 'false') return true
  return false
}

export const transactionsFilterSchema = z
  .object({
    startDate: z.string().trim().optional().refine(isValidDatePickerDate, {
      message: 'Start date must be a real date, like 18/01/2026',
    }),

    endDate: z.string().trim().optional().refine(isValidDatePickerDate, {
      message: 'End date must be a real date, like 18/01/2026',
    }),

    credit: z.string().trim().optional().refine(isValidBoolean, {
      message: 'Credit must be true or false',
    }),

    debit: z.string().trim().optional().refine(isValidBoolean, {
      message: 'Debit must be true or false',
    }),
  })
  .superRefine((data, ctx) => {
    const { startDate, endDate } = data

    if (!startDate || !endDate) return

    const start = parse(startDate, 'dd/MM/yyyy', new Date())

    const end = parse(endDate, 'dd/MM/yyyy', new Date())

    if (!isValid(start) || !isValid(end)) return

    if (end < start) {
      ctx.addIssue({
        path: ['endDate'],
        code: 'custom',
        message: 'End date cannot be earlier than start date',
      })
    }
  })

export function formatValidationErrors(error: z.ZodError) {
  const errors = error.issues.map(err => ({
    href: `#${String(err.path[0])}`,
    text: err.message,
  }))

  const errorMap = error.issues.reduce(
    (acc: Record<string, string>, err) => {
      acc[String(err.path[0])] = err.message
      return acc
    },
    {} as Record<string, string>,
  )

  return { errors, errorMap }
}
