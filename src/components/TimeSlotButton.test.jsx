import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TimeSlotButton from './TimeSlotButton'

describe('TimeSlotButton', () => {
  it('should display time in HH:mm format', () => {
    const slot = { time: '10:00', available: true }
    render(<TimeSlotButton slot={slot} isSelected={false} onSelect={() => {}} />)
    
    expect(screen.getByText('10:00')).toBeInTheDocument()
  })

  it('should apply selected styles when isSelected is true', () => {
    const slot = { time: '10:00', available: true }
    render(<TimeSlotButton slot={slot} isSelected={true} onSelect={() => {}} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-600')
  })

  it('should call onSelect when clicked', () => {
    const slot = { time: '10:00', available: true }
    const onSelect = vi.fn()
    render(<TimeSlotButton slot={slot} isSelected={false} onSelect={onSelect} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(onSelect).toHaveBeenCalledWith(slot)
  })

  it('should be disabled when slot is not available', () => {
    const slot = { time: '10:00', available: false }
    render(<TimeSlotButton slot={slot} isSelected={false} onSelect={() => {}} />)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should have minimum tap target of 44x44 pixels', () => {
    const slot = { time: '10:00', available: true }
    render(<TimeSlotButton slot={slot} isSelected={false} onSelect={() => {}} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('min-h-[44px]')
  })

  it('should apply hover styles when available and not selected', () => {
    const slot = { time: '10:00', available: true }
    render(<TimeSlotButton slot={slot} isSelected={false} onSelect={() => {}} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('hover:border-gray-600')
  })

  it('should not be clickable when unavailable', () => {
    const slot = { time: '10:00', available: false }
    const onSelect = vi.fn()
    render(<TimeSlotButton slot={slot} isSelected={false} onSelect={onSelect} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    // Should not call onSelect when disabled
    expect(onSelect).not.toHaveBeenCalled()
  })
})
