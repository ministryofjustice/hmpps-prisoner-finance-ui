import { z } from 'zod'

const holdsFilterSchema = z.object({
  page: z.coerce.number().default(1),
})

export function formatHoldsValidationErrors(error: z.ZodError) {
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

export default holdsFilterSchema
