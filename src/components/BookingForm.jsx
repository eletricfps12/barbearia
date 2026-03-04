import { useState } from 'react'
import { validateClientName, validateClientPhone } from '../utils/validation'

/**
 * BookingForm Component
 * Collects client information and handles booking confirmation
 * 
 * Validates: Requirements 6.5, 10.3, 10.4, 7.1, 7.2
 * 
 * @param {Object} props
 * @param {string} props.clientName - Current client name value
 * @param {string} props.clientPhone - Current client phone value
 * @param {Function} props.onNameChange - Handler for name input changes
 * @param {Function} props.onPhoneChange - Handler for phone input changes
 * @param {Function} props.onSubmit - Handler for form submission
 * @param {boolean} props.isSubmitting - Whether form is currently submitting
 * @param {boolean} props.canSubmit - Whether form can be submitted (all validations pass)
 * @param {Object} props.errors - Validation error messages
 * @param {string|null} props.errors.name - Name field error message
 * @param {string|null} props.errors.phone - Phone field error message
 */
export default function BookingForm({
  clientName,
  clientPhone,
  onNameChange,
  onPhoneChange,
  onSubmit,
  isSubmitting,
  canSubmit,
  errors
}) {
  const [touched, setTouched] = useState({
    name: false,
    phone: false
  })

  const handleNameBlur = () => {
    setTouched(prev => ({ ...prev, name: true }))
  }

  const handlePhoneBlur = () => {
    setTouched(prev => ({ ...prev, phone: true }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (canSubmit && !isSubmitting) {
      onSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Input */}
      <div>
        <label 
          htmlFor="client-name" 
          className="block text-sm font-medium text-gray-200 mb-2"
        >
          Nome
        </label>
        <input
          id="client-name"
          type="text"
          value={clientName}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={handleNameBlur}
          className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
            touched.name && errors.name
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-700 focus:ring-blue-500'
          }`}
          placeholder="Digite seu nome completo"
          disabled={isSubmitting}
        />
        {touched.name && errors.name && (
          <p className="mt-2 text-sm text-red-400">
            {errors.name}
          </p>
        )}
      </div>

      {/* Phone Input */}
      <div>
        <label 
          htmlFor="client-phone" 
          className="block text-sm font-medium text-gray-200 mb-2"
        >
          Telefone
        </label>
        <input
          id="client-phone"
          type="tel"
          value={clientPhone}
          onChange={(e) => onPhoneChange(e.target.value)}
          onBlur={handlePhoneBlur}
          className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors ${
            touched.phone && errors.phone
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-700 focus:ring-blue-500'
          }`}
          placeholder="(11) 98765-4321"
          disabled={isSubmitting}
        />
        {touched.phone && errors.phone && (
          <p className="mt-2 text-sm text-red-400">
            {errors.phone}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
          !canSubmit || isSubmitting
            ? 'bg-gray-700 cursor-not-allowed opacity-50'
            : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
        }`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <svg 
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Confirmando...
          </span>
        ) : (
          'Confirmar Agendamento'
        )}
      </button>
    </form>
  )
}
