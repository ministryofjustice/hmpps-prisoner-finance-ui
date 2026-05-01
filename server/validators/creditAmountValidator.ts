import { z } from 'zod'

export default z.coerce
  .string()
  .min(1, { message: 'Amount is required.' })
  .regex(/^-?\d+(\.\d{1,2})?$/, {
    message: 'Must be a valid number with up to 2 decimal places.',
  })
  .transform(val => Number(val))
  .refine(val => val > 0, {
    message: 'Amount must be greater than 0.',
  })
