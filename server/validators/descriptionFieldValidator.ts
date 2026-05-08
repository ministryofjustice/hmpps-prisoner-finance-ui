import { z } from 'zod'

export default z
  .string()
  .min(1, { message: 'Description cannot be empty.' })
  .max(255, { message: 'Description cannot exceed 255 characters.' })
