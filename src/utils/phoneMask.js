/**
 * Formata número de telefone brasileiro
 * Aceita: (11) 99999-9999 ou (11) 9999-9999
 */
export const formatPhone = (value) => {
  if (!value) return ''
  
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '')
  
  // Aplica a máscara
  if (numbers.length <= 10) {
    // Formato: (11) 9999-9999
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  } else {
    // Formato: (11) 99999-9999
    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15)
  }
}

/**
 * Remove máscara do telefone
 */
export const unformatPhone = (value) => {
  return value.replace(/\D/g, '')
}

/**
 * Valida telefone brasileiro
 */
export const validatePhone = (value) => {
  const numbers = unformatPhone(value)
  return numbers.length === 10 || numbers.length === 11
}
