import { z } from 'zod'
import pageNumberQuerySchema from './pageNumberQueryValidator'

export default pageNumberQuerySchema.extend({
  holdType: z.enum([undefined, 'WHF', 'HOA']).default(undefined),
})
