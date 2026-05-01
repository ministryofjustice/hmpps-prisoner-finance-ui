import creditAmountValidator from './creditAmountValidator'

describe('creditAmountValidator', () => {
  describe('Valid String Inputs', () => {
    it('should accept a whole number string and coerce to a number', () => {
      const result = creditAmountValidator.safeParse('100')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(100)
        expect(typeof result.data).toBe('number')
      }
    })

    it('should accept a string with one decimal place', () => {
      const result = creditAmountValidator.safeParse('10.5')
      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toBe(10.5)
    })

    it('should accept a string with exactly two decimal places', () => {
      const result = creditAmountValidator.safeParse('10.99')
      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toBe(10.99)
    })

    it('should accept a string with trailing zeroes and normalize it', () => {
      const result = creditAmountValidator.safeParse('10.90')
      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toBe(10.9) // Number(10.90) === 10.9
    })
  })

  describe('Invalid String Inputs', () => {
    it('should reject a zero string', () => {
      const result = creditAmountValidator.safeParse('0')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Amount must be greater than 0.')
      }
    })

    it('should reject a string with three decimal places', () => {
      const result = creditAmountValidator.safeParse('10.999')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Must be a valid number with up to 2 decimal places.')
      }
    })

    it('should reject a negative number string', () => {
      const result = creditAmountValidator.safeParse('-10.50')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Amount must be greater than 0.')
      }
    })

    it('should reject completely non-numeric strings with the custom invalid type error', () => {
      const result = creditAmountValidator.safeParse('abc')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Must be a valid number with up to 2 decimal places.')
      }
    })
  })
})
