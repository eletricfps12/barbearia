import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BookingForm from './BookingForm'

describe('BookingForm', () => {
  const defaultProps = {
    clientName: '',
    clientPhone: '',
    onNameChange: vi.fn(),
    onPhoneChange: vi.fn(),
    onSubmit: vi.fn(),
    isSubmitting: false,
    canSubmit: false,
    errors: {
      name: null,
      phone: null
    }
  }

  it('should render name and phone input fields', () => {
    render(<BookingForm {...defaultProps} />)
    
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
    expect(screen.getByLabelText('Telefone')).toBeInTheDocument()
  })

  it('should render submit button with correct text', () => {
    render(<BookingForm {...defaultProps} />)
    
    expect(screen.getByRole('button', { name: /confirmar agendamento/i })).toBeInTheDocument()
  })

  it('should disable submit button when canSubmit is false', () => {
    render(<BookingForm {...defaultProps} canSubmit={false} />)
    
    const submitButton = screen.getByRole('button', { name: /confirmar agendamento/i })
    expect(submitButton).toBeDisabled()
  })

  it('should enable submit button when canSubmit is true', () => {
    render(<BookingForm {...defaultProps} canSubmit={true} />)
    
    const submitButton = screen.getByRole('button', { name: /confirmar agendamento/i })
    expect(submitButton).not.toBeDisabled()
  })

  it('should call onNameChange when name input changes', () => {
    const onNameChange = vi.fn()
    render(<BookingForm {...defaultProps} onNameChange={onNameChange} />)
    
    const nameInput = screen.getByLabelText('Nome')
    fireEvent.change(nameInput, { target: { value: 'João Silva' } })
    
    expect(onNameChange).toHaveBeenCalledWith('João Silva')
  })

  it('should call onPhoneChange when phone input changes', () => {
    const onPhoneChange = vi.fn()
    render(<BookingForm {...defaultProps} onPhoneChange={onPhoneChange} />)
    
    const phoneInput = screen.getByLabelText('Telefone')
    fireEvent.change(phoneInput, { target: { value: '(11) 98765-4321' } })
    
    expect(onPhoneChange).toHaveBeenCalledWith('(11) 98765-4321')
  })

  it('should display name error message after blur when error exists', () => {
    render(
      <BookingForm 
        {...defaultProps} 
        errors={{ name: 'Nome deve ter pelo menos 2 caracteres', phone: null }}
      />
    )
    
    const nameInput = screen.getByLabelText('Nome')
    fireEvent.blur(nameInput)
    
    expect(screen.getByText('Nome deve ter pelo menos 2 caracteres')).toBeInTheDocument()
  })

  it('should display phone error message after blur when error exists', () => {
    render(
      <BookingForm 
        {...defaultProps} 
        errors={{ name: null, phone: 'Telefone inválido. Use o formato (XX) XXXXX-XXXX' }}
      />
    )
    
    const phoneInput = screen.getByLabelText('Telefone')
    fireEvent.blur(phoneInput)
    
    expect(screen.getByText('Telefone inválido. Use o formato (XX) XXXXX-XXXX')).toBeInTheDocument()
  })

  it('should not display error messages before blur', () => {
    render(
      <BookingForm 
        {...defaultProps} 
        errors={{ name: 'Nome inválido', phone: 'Telefone inválido' }}
      />
    )
    
    expect(screen.queryByText('Nome inválido')).not.toBeInTheDocument()
    expect(screen.queryByText('Telefone inválido')).not.toBeInTheDocument()
  })

  it('should call onSubmit when form is submitted with valid data', () => {
    const onSubmit = vi.fn()
    render(
      <BookingForm 
        {...defaultProps} 
        canSubmit={true}
        onSubmit={onSubmit}
      />
    )
    
    const submitButton = screen.getByRole('button', { name: /confirmar agendamento/i })
    fireEvent.click(submitButton)
    
    expect(onSubmit).toHaveBeenCalled()
  })

  it('should not call onSubmit when canSubmit is false', () => {
    const onSubmit = vi.fn()
    render(
      <BookingForm 
        {...defaultProps} 
        canSubmit={false}
        onSubmit={onSubmit}
      />
    )
    
    const submitButton = screen.getByRole('button', { name: /confirmar agendamento/i })
    fireEvent.click(submitButton)
    
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('should show loading state when isSubmitting is true', () => {
    render(<BookingForm {...defaultProps} isSubmitting={true} />)
    
    expect(screen.getByText('Confirmando...')).toBeInTheDocument()
  })

  it('should disable inputs when isSubmitting is true', () => {
    render(<BookingForm {...defaultProps} isSubmitting={true} />)
    
    expect(screen.getByLabelText('Nome')).toBeDisabled()
    expect(screen.getByLabelText('Telefone')).toBeDisabled()
  })

  it('should apply error styling to name input when error exists and field is touched', () => {
    render(
      <BookingForm 
        {...defaultProps} 
        errors={{ name: 'Nome inválido', phone: null }}
      />
    )
    
    const nameInput = screen.getByLabelText('Nome')
    fireEvent.blur(nameInput)
    
    expect(nameInput).toHaveClass('border-red-500')
  })

  it('should apply error styling to phone input when error exists and field is touched', () => {
    render(
      <BookingForm 
        {...defaultProps} 
        errors={{ name: null, phone: 'Telefone inválido' }}
      />
    )
    
    const phoneInput = screen.getByLabelText('Telefone')
    fireEvent.blur(phoneInput)
    
    expect(phoneInput).toHaveClass('border-red-500')
  })
})
