/**
 * Validation utilities for client booking form
 * Validates: Requirements 10.1, 10.2, 10.5
 */

/**
 * Trims whitespace from the beginning and end of a string
 * @param {string} input - The input string to trim
 * @returns {string} The trimmed string
 */
export function trimInput(input) {
  if (typeof input !== 'string') {
    return ''
  }
  return input.trim()
}

/**
 * Validates client name
 * Requirements: Minimum 2 characters after trimming whitespace
 * @param {string} name - The client name to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validateClientName(name) {
  const trimmedName = trimInput(name)
  return trimmedName.length >= 2
}

/**
 * Validates Brazilian phone number format
 * Accepts formats: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
 * @param {string} phone - The phone number to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validateClientPhone(phone) {
  const trimmedPhone = trimInput(phone)
  
  // Brazilian phone format: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
  // Regex explanation:
  // ^\( - starts with opening parenthesis
  // \d{2} - exactly 2 digits (area code)
  // \) - closing parenthesis
  // \s? - optional space
  // \d{4,5} - 4 or 5 digits (first part of number)
  // -? - optional hyphen
  // \d{4}$ - exactly 4 digits at the end
  const phoneRegex = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/
  
  return phoneRegex.test(trimmedPhone)
}
