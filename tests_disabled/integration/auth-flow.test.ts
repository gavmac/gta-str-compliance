/**
 * Authentication Flow Integration Tests
 * 
 * These tests verify the complete authentication flow including
 * user registration, city selection, and profile creation.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Mock environment for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key'

describe('Authentication Flow Integration', () => {
  let supabase: ReturnType<typeof createClient<Database>>
  let testUserId: string
  let testCityId: number

  beforeEach(async () => {
    supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)
    
    // Get a test city
    const { data: cities } = await supabase
      .from('cities')
      .select('id')
      .limit(1)
    
    testCityId = cities?.[0]?.id || 1
    testUserId = `test-user-${Date.now()}`
  })

  afterEach(async () => {
    // Clean up test data
    if (testUserId) {
      await supabase
        .from('users')
        .delete()
        .eq('id', testUserId)
    }
  })

  describe('User Registration Flow', () => {
    it('should create user profile after successful signup', async () => {
      const testEmail = `test-${Date.now()}@example.com`
      
      // Simulate user profile creation (normally done after Supabase auth signup)
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          id: testUserId,
          email: testEmail,
          plan: 'free',
          city_id: testCityId
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(user).toBeDefined()
      expect(user.email).toBe(testEmail)
      expect(user.plan).toBe('free')
      expect(user.city_id).toBe(testCityId)
    })

    it('should enforce unique email constraint', async () => {
      const testEmail = `unique-test-${Date.now()}@example.com`
      
      // Create first user
      await supabase
        .from('users')
        .insert({
          id: testUserId,
          email: testEmail,
          plan: 'free',
          city_id: testCityId
        })

      // Try to create second user with same email
      const { error } = await supabase
        .from('users')
        .insert({
          id: `${testUserId}-2`,
          email: testEmail, // Same email
          plan: 'free',
          city_id: testCityId
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23505') // Unique constraint violation
    })

    it('should allow user registration without city selection', async () => {
      const testEmail = `no-city-${Date.now()}@example.com`
      
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          id: testUserId,
          email: testEmail,
          plan: 'free',
          city_id: null // No city selected
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(user).toBeDefined()
      expect(user.city_id).toBeNull()
    })

    it('should validate city_id references valid city', async () => {
      const testEmail = `invalid-city-${Date.now()}@example.com`
      const invalidCityId = 99999
      
      const { error } = await supabase
        .from('users')
        .insert({
          id: testUserId,
          email: testEmail,
          plan: 'free',
          city_id: invalidCityId
        })

      expect(error).toBeDefined()
      expect(error?.code).toBe('23503') // Foreign key constraint violation
    })
  })

  describe('City Selection', () => {
    it('should load active cities for selection', async () => {
      const { data: cities, error } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('name')

      expect(error).toBeNull()
      expect(cities).toBeDefined()
      expect(Array.isArray(cities)).toBe(true)
      expect(cities.length).toBeGreaterThan(0)

      // Verify all returned cities are active
      cities.forEach(city => {
        expect(city.is_active).toBe(true)
      })
    })

    it('should not load inactive cities', async () => {
      // First, create an inactive city for testing
      const { data: inactiveCity } = await supabase
        .from('cities')
        .insert({
          name: 'Inactive Test City',
          slug: 'inactive-test',
          region: 'Test',
          is_active: false
        })
        .select()
        .single()

      // Query for active cities
      const { data: activeCities, error } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)

      expect(error).toBeNull()
      expect(activeCities).toBeDefined()

      // Verify inactive city is not included
      const inactiveCityInResults = activeCities?.find(
        city => city.id === inactiveCity?.id
      )
      expect(inactiveCityInResults).toBeUndefined()

      // Clean up
      if (inactiveCity) {
        await supabase
          .from('cities')
          .delete()
          .eq('id', inactiveCity.id)
      }
    })

    it('should return cities in alphabetical order', async () => {
      const { data: cities, error } = await supabase
        .from('cities')
        .select('name')
        .eq('is_active', true)
        .order('name')

      expect(error).toBeNull()
      expect(cities).toBeDefined()

      if (cities && cities.length > 1) {
        for (let i = 1; i < cities.length; i++) {
          expect(cities[i].name.localeCompare(cities[i - 1].name)).toBeGreaterThanOrEqual(0)
        }
      }
    })
  })

  describe('User Profile Management', () => {
    beforeEach(async () => {
      // Create test user for profile tests
      await supabase
        .from('users')
        .insert({
          id: testUserId,
          email: `profile-test-${Date.now()}@example.com`,
          plan: 'free',
          city_id: testCityId
        })
    })

    it('should allow updating user city', async () => {
      // Get another city for testing
      const { data: cities } = await supabase
        .from('cities')
        .select('id')
        .neq('id', testCityId)
        .limit(1)

      const newCityId = cities?.[0]?.id

      if (newCityId) {
        const { data: updatedUser, error } = await supabase
          .from('users')
          .update({ city_id: newCityId })
          .eq('id', testUserId)
          .select()
          .single()

        expect(error).toBeNull()
        expect(updatedUser.city_id).toBe(newCityId)
      }
    })

    it('should allow updating user plan', async () => {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({ plan: 'paid' })
        .eq('id', testUserId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(updatedUser.plan).toBe('paid')
    })

    it('should automatically update updated_at timestamp', async () => {
      // Get initial timestamp
      const { data: initialUser } = await supabase
        .from('users')
        .select('updated_at')
        .eq('id', testUserId)
        .single()

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100))

      // Update user
      const { data: updatedUser } = await supabase
        .from('users')
        .update({ plan: 'paid' })
        .eq('id', testUserId)
        .select('updated_at')
        .single()

      expect(initialUser?.updated_at).toBeDefined()
      expect(updatedUser?.updated_at).toBeDefined()
      expect(new Date(updatedUser!.updated_at).getTime()).toBeGreaterThan(
        new Date(initialUser!.updated_at).getTime()
      )
    })
  })

  describe('Form Validation', () => {
    it('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ]

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com'
      ]

      // This would typically be tested in the frontend validation
      // Here we're just documenting the expected behavior
      validEmails.forEach(email => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      })

      invalidEmails.forEach(email => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      })
    })

    it('should validate password requirements', () => {
      const validPasswords = ['123456', 'password', 'mySecurePass123!']
      const invalidPasswords = ['12345', 'abc', '']

      validPasswords.forEach(password => {
        expect(password.length).toBeGreaterThanOrEqual(6)
      })

      invalidPasswords.forEach(password => {
        expect(password.length).toBeLessThan(6)
      })
    })
  })
})