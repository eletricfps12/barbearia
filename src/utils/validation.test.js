import { describe, it, expect } from 'vitest'
import { trimInput, validateClientName, validateClientPhone } from './validation'

describe('trimInput', () => {
  it('should remove leading and trailing whitespace', () => {
    expect(trimInput('  hello  ')).toBe('hello')
    expect(trimInput('\t\ntest\n\t')).toBe('test')
  })

  it('should handle strings without whitespace', () => {
    expect(trimInput('hello')).toBe('hello')
  })

  it('should handle empty strings', () => {
    expect(trimInput('')).toBe('')
    expect(trimInput('   ')).toBe('')
  })

  it('should return empty string for non-string inputs', () => {
    expect(trimInput(null)).toBe('')
    expect(trimInput(undefined)).toBe('')
    expect(trimInput(123)).toBe('')
  })
})

describe('validateClientName', () => {
  it('should accept valid names with minimum 2 characters', () => {
    expect(validateClientName('Jo')).toBe(true)
    expect(validateClientName('João Silva')).toBe(true)
    expect(validateClientName('Maria')).toBe(true)
  })

  it('should trim whitespace before validation', () => {
    expect(validateClientName('  João  ')).toBe(true)
    expect(validateClientName('\tMaria\n')).toBe(true)
  })

  it('should reject names with fewer than 2 characters', () => {
    expect(validateClientName('J')).toBe(false)
    expect(validateClientName('')).toBe(false)
  })

  it('should reject names that are only whitespace', () => {
    expect(validateClientName('   ')).toBe(false)
    expect(validateClientName('\t\n')).toBe(false)
  })
})

describe('validateClientPhone', () => {
  it('should accept valid Brazilian phone formats with 9 digits', () => {
    expect(validateClientPhone('(11) 98765-4321')).toBe(true)
    expect(validateClientPhone('(21) 99999-8888')).toBe(true)
  })

  it('should accept valid Brazilian phone formats with 8 digits', () => {
    expect(validateClientPhone('(11) 3456-7890')).toBe(true)
    expect(validateClientPhone('(21) 2222-3333')).toBe(true)
  })

  it('should accept formats without space after area code', () => {
    expect(validateClientPhone('(11)98765-4321')).toBe(true)
    expect(validateClientPhone('(21)3456-7890')).toBe(true)
  })

  it('should accept formats without hyphen', () => {
    expect(validateClientPhone('(11) 987654321')).toBe(true)
    expect(validateClientPhone('(21) 34567890')).toBe(true)
  })

  it('should accept formats without space and hyphen', () => {
    expect(validateClientPhone('(11)987654321')).toBe(true)
    expect(validateClientPhone('(21)34567890')).toBe(true)
  })

  it('should trim whitespace before validation', () => {
    expect(validateClientPhone('  (11) 98765-4321  ')).toBe(true)
  })

  it('should reject invalid formats', () => {
    expect(validateClientPhone('11 98765-4321')).toBe(false) // missing parentheses
    expect(validateClientPhone('(11) 8765-4321')).toBe(false) // wrong number of digits
    expect(validateClientPhone('(1) 98765-4321')).toBe(false) // area code too short
    expect(validateClientPhone('(111) 98765-4321')).toBe(false) // area code too long
    expect(validateClientPhone('(11) 98765-43210')).toBe(false) // too many digits
    expect(validateClientPhone('')).toBe(false) // empty string
    expect(validateClientPhone('invalid')).toBe(false) // not a phone number
  })
})
