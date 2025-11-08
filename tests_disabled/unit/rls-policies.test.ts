/**
 * Row Level Security (RLS) Policy Tests
 * 
 * These tests verify that RLS policies prevent unauthorized data access
 * and ensure users can only access their own data.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Mock Supabase client for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key'

describe('Row Level Security Policies', () => {
  let supabase: ReturnType<typeof createClient<Database>>
  let testUser1Id: string
  let testUser2Id: string
  let testCityId: number

  beforeEach(async () => {
    supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)
    
    // Create test users (this would normally be done through auth)
    testUser1Id = 'test-user-1-uuid'
    testUser2Id = 'test-user-2-uuid'
    
    // Get a test city
    const { data: cities } = await supabase
      .from('cities')
      .select('id')
      .limit(1)
    
    testCityId = cities?.[0]?.id || 1
  })

  afterEach(async () => {
    // Clean up test data
    await supabase
      .from('properties')
      .delete()
      .in('user_id', [testUser1Id, testUser2Id])
    
    await supabase
      .from('users')
      .delete()
      .in('id', [testUser1Id, testUser2Id])
  })

  describe('Users Table RLS', () => {
    it('should allow users to view their own profile', async () => {
      // Insert test user
      await supabase
        .from('users')
        .insert({
          id: testUser1Id,
          email: 'test1@example.com',
          plan: 'free',
          city_id: testCityId
        })

      // Simulate authenticated user context
      const userClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
        global: {
          headers: {
            'Authorization': `Bearer ${testUser1Id}` // Mock JWT
          }
        }
      })

      const { data, error } = await userClient
        .from('users')
        .select('*')
        .eq('id', testUser1Id)

      expect(error).toBeNull()
      expect(data).toHaveLength(1)
      expect(data?.[0].email).toBe('test1@example.com')
    })

    it('should prevent users from viewing other users profiles', async () => {
      // Insert two test users
      await supabase
        .from('users')
        .insert([
          {
            id: testUser1Id,
            email: 'test1@example.com',
            plan: 'free',
            city_id: testCityId
          },
          {
            id: testUser2Id,
            email: 'test2@example.com',
            plan: 'paid',
            city_id: testCityId
          }
        ])

      // User 1 tries to access User 2's data
      const user1Client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
        global: {
          headers: {
            'Authorization': `Bearer ${testUser1Id}`
          }
        }
      })

      const { data, error } = await user1Client
        .from('users')
        .select('*')
        .eq('id', testUser2Id)

      // Should return empty result due to RLS
      expect(data).toHaveLength(0)
    })
  })

  describe('Properties Table RLS', () => {
    it('should allow users to view their own properties', async () => {
      // Create test user and property
      await supabase
        .from('users')
        .insert({
          id: testUser1Id,
          email: 'test1@example.com',
          plan: 'paid',
          city_id: testCityId
        })

      const propertyId = 'test-property-1'
      await supabase
        .from('properties')
        .insert({
          id: propertyId,
          user_id: testUser1Id,
          address_line1: '123 Test St',
          city_id: testCityId,
          type: 'STR'
        })

      const userClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
        global: {
          headers: {
            'Authorization': `Bearer ${testUser1Id}`
          }
        }
      })

      const { data, error } = await userClient
        .from('properties')
        .select('*')
        .eq('user_id', testUser1Id)

      expect(error).toBeNull()
      expect(data).toHaveLength(1)
      expect(data?.[0].address_line1).toBe('123 Test St')
    })

    it('should prevent users from viewing other users properties', async () => {
      // Create two users with properties
      await supabase
        .from('users')
        .insert([
          {
            id: testUser1Id,
            email: 'test1@example.com',
            plan: 'paid',
            city_id: testCityId
          },
          {
            id: testUser2Id,
            email: 'test2@example.com',
            plan: 'paid',
            city_id: testCityId
          }
        ])

      await supabase
        .from('properties')
        .insert([
          {
            id: 'property-1',
            user_id: testUser1Id,
            address_line1: '123 User1 St',
            city_id: testCityId,
            type: 'STR'
          },
          {
            id: 'property-2',
            user_id: testUser2Id,
            address_line1: '456 User2 St',
            city_id: testCityId,
            type: 'LTR'
          }
        ])

      // User 1 tries to access all properties
      const user1Client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
        global: {
          headers: {
            'Authorization': `Bearer ${testUser1Id}`
          }
        }
      })

      const { data, error } = await user1Client
        .from('properties')
        .select('*')

      expect(error).toBeNull()
      expect(data).toHaveLength(1) // Should only see their own property
      expect(data?.[0].address_line1).toBe('123 User1 St')
    })
  })

  describe('Documents Table RLS', () => {
    it('should allow users to access documents for their properties', async () => {
      // Setup user and property
      await supabase
        .from('users')
        .insert({
          id: testUser1Id,
          email: 'test1@example.com',
          plan: 'paid',
          city_id: testCityId
        })

      const propertyId = 'test-property-1'
      await supabase
        .from('properties')
        .insert({
          id: propertyId,
          user_id: testUser1Id,
          address_line1: '123 Test St',
          city_id: testCityId,
          type: 'STR'
        })

      const documentId = 'test-document-1'
      await supabase
        .from('documents')
        .insert({
          id: documentId,
          property_id: propertyId,
          kind: 'license',
          file_name: 'license.pdf',
          file_url: '/documents/license.pdf'
        })

      const userClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
        global: {
          headers: {
            'Authorization': `Bearer ${testUser1Id}`
          }
        }
      })

      const { data, error } = await userClient
        .from('documents')
        .select('*')
        .eq('property_id', propertyId)

      expect(error).toBeNull()
      expect(data).toHaveLength(1)
      expect(data?.[0].file_name).toBe('license.pdf')
    })

    it('should prevent users from accessing documents for other users properties', async () => {
      // Setup two users with properties and documents
      await supabase
        .from('users')
        .insert([
          {
            id: testUser1Id,
            email: 'test1@example.com',
            plan: 'paid',
            city_id: testCityId
          },
          {
            id: testUser2Id,
            email: 'test2@example.com',
            plan: 'paid',
            city_id: testCityId
          }
        ])

      const property1Id = 'property-1'
      const property2Id = 'property-2'
      
      await supabase
        .from('properties')
        .insert([
          {
            id: property1Id,
            user_id: testUser1Id,
            address_line1: '123 User1 St',
            city_id: testCityId,
            type: 'STR'
          },
          {
            id: property2Id,
            user_id: testUser2Id,
            address_line1: '456 User2 St',
            city_id: testCityId,
            type: 'LTR'
          }
        ])

      await supabase
        .from('documents')
        .insert([
          {
            id: 'doc-1',
            property_id: property1Id,
            kind: 'license',
            file_name: 'user1-license.pdf',
            file_url: '/documents/user1-license.pdf'
          },
          {
            id: 'doc-2',
            property_id: property2Id,
            kind: 'insurance',
            file_name: 'user2-insurance.pdf',
            file_url: '/documents/user2-insurance.pdf'
          }
        ])

      // User 1 tries to access all documents
      const user1Client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
        global: {
          headers: {
            'Authorization': `Bearer ${testUser1Id}`
          }
        }
      })

      const { data, error } = await user1Client
        .from('documents')
        .select('*')

      expect(error).toBeNull()
      expect(data).toHaveLength(1) // Should only see their own document
      expect(data?.[0].file_name).toBe('user1-license.pdf')
    })
  })

  describe('Public Tables Access', () => {
    it('should allow authenticated users to view cities', async () => {
      const userClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
        global: {
          headers: {
            'Authorization': `Bearer ${testUser1Id}`
          }
        }
      })

      const { data, error } = await userClient
        .from('cities')
        .select('*')
        .limit(5)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should allow authenticated users to view published rule updates', async () => {
      const userClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
        global: {
          headers: {
            'Authorization': `Bearer ${testUser1Id}`
          }
        }
      })

      const { data, error } = await userClient
        .from('rule_updates')
        .select('*')
        .eq('is_published', true)
        .limit(5)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })
  })
})