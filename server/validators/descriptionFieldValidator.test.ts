import descriptionFieldValidator from './descriptionFieldValidator'

describe('descriptionFieldValidator', () => {
  describe('Valid Inputs', () => {
    it('should accept a standard description', () => {
      const result = descriptionFieldValidator.safeParse('This is a valid description.')
      expect(result.success).toBe(true)
    })

    it('should accept a description exactly at the minimum length', () => {
      const result = descriptionFieldValidator.safeParse('a')
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid Inputs', () => {
    it('should reject an empty string', () => {
      const result = descriptionFieldValidator.safeParse('')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Description cannot be empty.')
      }
    })

    it('should reject a string that exceeds the maximum length', () => {
      const tooLongString = 'a'.repeat(501)
      const result = descriptionFieldValidator.safeParse(tooLongString)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Description cannot exceed 500 characters.')
      }
    })
  })
})
