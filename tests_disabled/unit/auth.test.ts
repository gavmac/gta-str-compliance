/**
 * Authentication System Tests
 * 
 * These tests verify the authentication utilities and validation functions
 */

import { describe, it, expect } from '@jest/globals'
import {
  isValidEmail,
  isValidPassword,
  getPasswordStrength,
  formatAuthError,
  isAuthRoute,
  isProtectedRoute,
  isPremiumRoute
} from '@/lib/auth/utils'

describe('Authentication Utils', () => {
  describe('Email Validation', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ]

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true)
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        'user name@example.com'
      ]

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false)
      })
    })
  })

  describe('Password Validation', () => {
    it('should validate passwords with minimum length', () => {
      expect(isValidPassword('123456')).toBe(true)
      expect(isValidPassword('password')).toBe(true)
      expect(isValidPassword('a'.repeat(6))).toBe(true)
    })

    it('should reject passwords that are too short', () => {
      expect(isValidPassword('12345')).toBe(false)
      expect(isValidPassword('abc')).toBe(false)
      expect(isValidPassword('')).toBe(false)
    })
  })

  describe('Password Strength', () => {
    it('should score weak passwords correctly', () => {
      const { score, feedback } = getPasswordStrength('123')
      expect(score).toBeLessThan(3)
      expect(feedback.length).toBeGreaterThan(0)
      expect(feedback).toContain('Use at least 8 characters')
    })

    it('should score medium passwords correctly', () => {
      const { score, feedback } = getPasswordStrength('Password1')
      expect(score).toBeGreaterThanOrEqual(3)
      expect(score).toBeLessThan(5)
    })

    it('should score strong passwords correctly', () => {
      const { score, feedback } = getPasswordStrength('Password123!')
      expect(score).toBe(5)
      expect(feedback.length).toBe(0)
    })

    it('should provide helpful feedback', () => {
      const { feedback } = getPasswordStrength('password')
      expect(feedback).toContain('Include uppercase letters')
      expect(feedback).toContain('Include numbers')
      expect(feedback).toContain('Include special characters')
    })
  })

  describe('Error Formatting', () => {
    it('should format common Supabase auth errors', () => {
      const testCases = [
        {
          error: { message: 'Invalid login credentials' },
          expected: 'Invalid email or password. Please check your credentials and try again.'
        },
        {
          error: { message: 'Email not confirmed' },
          expected: 'Please check your email and click the confirmation link before signing in.'
        },
        {
          error: { message: 'User already registered' },
          expected: 'An account with this email already exists. Please sign in instead.'
        },
        {
          error: { message: 'Password should be at least 6 characters' },
          expected: 'Password must be at least 6 characters long.'
        }
      ]

      testCases.forEach(({ error, expected }) => {
        expect(formatAuthError(error)).toBe(expected)
      })
    })

    it('should handle unknown errors gracefully', () => {
      const unknownError = { message: 'Some unknown error' }
      expect(formatAuthError(unknownError)).toBe('Some unknown error')
    })

    it('should handle null/undefined errors', () => {
      expect(formatAuthError(null)).toBe('An unknown error occurred')
      expect(formatAuthError(undefined)).toBe('An unknown error occurred')
    })
  })

  describe('Route Classification', () => {
    it('should identify auth routes correctly', () => {
      const authRoutes = [
        '/auth/signin',
        '/auth/signup',
        '/auth/forgot-password'
      ]

      authRoutes.forEach(route => {
        expect(isAuthRoute(route)).toBe(true)
      })

      const nonAuthRoutes = [
        '/',
        '/dashboard',
        '/properties',
        '/about'
      ]

      nonAuthRoutes.forEach(route => {
        expect(isAuthRoute(route)).toBe(false)
      })
    })

    it('should identify protected routes correctly', () => {
      const protectedRoutes = [
        '/dashboard',
        '/properties',
        '/documents',
        '/settings'
      ]

      protectedRoutes.forEach(route => {
        expect(isProtectedRoute(route)).toBe(true)
      })

      const publicRoutes = [
        '/',
        '/auth/signin',
        '/about',
        '/pricing'
      ]

      publicRoutes.forEach(route => {
        expect(isProtectedRoute(route)).toBe(false)
      })
    })

    it('should identify premium routes correctly', () => {
      const premiumRoutes = [
        '/properties',
        '/documents'
      ]

      premiumRoutes.forEach(route => {
        expect(isPremiumRoute(route)).toBe(true)
      })

      const nonPremiumRoutes = [
        '/',
        '/dashboard',
        '/settings',
        '/auth/signin'
      ]

      nonPremiumRoutes.forEach(route => {
        expect(isPremiumRoute(route)).toBe(false)
      })
    })

    it('should handle route prefixes correctly', () => {
      expect(isProtectedRoute('/dashboard/overview')).toBe(true)
      expect(isProtectedRoute('/properties/123')).toBe(true)
      expect(isPremiumRoute('/properties/123/edit')).toBe(true)
      expect(isAuthRoute('/auth/signin?redirect=/dashboard')).toBe(true)
    })
  })
})