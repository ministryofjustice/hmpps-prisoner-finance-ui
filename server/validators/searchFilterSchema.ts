import { z } from 'zod'

const prisonerSearchFilterSchema = z.object({
  page: z.coerce.number().default(1),
  term: z.string().trim().min(1, 'Enter a prison number or prisoner name').optional(),
})

export function formatSearchFilterValidationErrors(error: z.ZodError) {
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

export default prisonerSearchFilterSchema
