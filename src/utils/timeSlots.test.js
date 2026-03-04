import { describe, it, expect } from 'vitest'
import { generateAvailableSlots, timeToMinutes, addMinutes, timesOverlap } from './timeSlots'

describe('timeSlots utility functions', () => {
  describe('timeToMinutes', () => {
    it('should convert time string to minutes correctly', () => {
      expect(timeToMinutes('09:00')).toBe(540)
      expect(timeToMinutes('12:30')).toBe(750)
      expect(timeToMinutes('18:00')).toBe(1080)
    })
  })

  describe('addMinutes', () => {
    it('should add minutes to time string correctly', () => {
      expect(addMinutes('09:00', 30)).toBe('09:30')
      expect(addMinutes('09:30', 60)).toBe('10:30')
      expect(addMinutes('17:30', 30)).toBe('18:00')
    })

    it('should handle hour overflow correctly', () => {
      expect(addMinutes('09:45', 30)).toBe('10:15')
      expect(addMinutes('11:50', 20)).toBe('12:10')
    })
  })

  describe('timesOverlap', () => {
    it('should detect overlapping time ranges', () => {
      expect(timesOverlap('09:00', '10:00', '09:30', '10:30')).toBe(true)
      expect(timesOverlap('09:00', '10:00', '09:00', '10:00')).toBe(true)
      expect(timesOverlap('09:00', '10:00', '09:45', '10:15')).toBe(true)
    })

    it('should detect non-overlapping time ranges', () => {
      expect(timesOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false)
      expect(timesOverlap('09:00', '10:00', '10:30', '11:30')).toBe(false)
      expect(timesOverlap('10:00', '11:00', '09:00', '10:00')).toBe(false)
    })
  })

  describe('generateAvailableSlots', () => {
    it('should generate slots from 09:00 to 18:00 with 30-minute intervals', () => {
      const slots = generateAvailableSlots('2024-01-15', 30, [])
      
      expect(slots.length).toBeGreaterThan(0)
      expect(slots[0].time).toBe('09:00')
      expect(slots.every(slot => slot.available)).toBe(true)
    })

    it('should exclude slots where service does not fit before closing time', () => {
      const slots = generateAvailableSlots('2024-01-15', 60, [])
      
      // Last slot should be 17:00 (60 min service ends at 18:00)
      const lastSlot = slots[slots.length - 1]
      expect(timeToMinutes(lastSlot.time) + 60).toBeLessThanOrEqual(18 * 60)
    })

    it('should exclude slots that conflict with existing appointments', () => {
      const existingAppointments = [
        { start_time: '10:00', end_time: '11:00' },
        { start_time: '14:00', end_time: '15:00' }
      ]
      
      const slots = generateAvailableSlots('2024-01-15', 30, existingAppointments)
      
      // Slots at 10:00, 10:30 should be excluded (conflict with 10:00-11:00 appointment)
      expect(slots.find(s => s.time === '10:00')).toBeUndefined()
      expect(slots.find(s => s.time === '10:30')).toBeUndefined()
      
      // Slots at 14:00, 14:30 should be excluded (conflict with 14:00-15:00 appointment)
      expect(slots.find(s => s.time === '14:00')).toBeUndefined()
      expect(slots.find(s => s.time === '14:30')).toBeUndefined()
      
      // Slots before and after should be available
      expect(slots.find(s => s.time === '09:30')).toBeDefined()
      expect(slots.find(s => s.time === '11:00')).toBeDefined()
      expect(slots.find(s => s.time === '15:00')).toBeDefined()
    })

    it('should handle empty appointments array', () => {
      const slots = generateAvailableSlots('2024-01-15', 30, [])
      
      expect(slots.length).toBeGreaterThan(0)
      expect(slots.every(slot => slot.available)).toBe(true)
    })

    it('should consider service duration when checking conflicts', () => {
      const existingAppointments = [
        { start_time: '10:00', end_time: '11:00' }
      ]
      
      // 90-minute service starting at 09:00 would end at 10:30, conflicting with appointment
      const slots = generateAvailableSlots('2024-01-15', 90, existingAppointments)
      
      expect(slots.find(s => s.time === '09:00')).toBeUndefined()
      expect(slots.find(s => s.time === '09:30')).toBeUndefined()
    })

    it('should handle long service durations correctly', () => {
      const slots = generateAvailableSlots('2024-01-15', 120, [])
      
      // 120-minute service, last possible slot is 16:00 (ends at 18:00)
      const lastSlot = slots[slots.length - 1]
      expect(lastSlot.time).toBe('16:00')
    })
  })
})
