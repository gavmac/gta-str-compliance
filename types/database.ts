export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          plan: 'free' | 'paid'
          city_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          plan?: 'free' | 'paid'
          city_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          plan?: 'free' | 'paid'
          city_id?: number | null
          updated_at?: string
        }
      }
      cities: {
        Row: {
          id: number
          name: string
          slug: string
          region: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          region?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          region?: string
          is_active?: boolean
          updated_at?: string
        }
      }
      rules: {
        Row: {
          id: number
          city_id: number
          key: string
          name: string
          frequency_iso: string | null
          notes_markdown: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          city_id: number
          key: string
          name: string
          frequency_iso?: string | null
          notes_markdown?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          city_id?: number
          key?: string
          name?: string
          frequency_iso?: string | null
          notes_markdown?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      rule_updates: {
        Row: {
          id: number
          city_id: number
          title: string
          summary_markdown: string
          effective_date: string | null
          source_url: string | null
          is_published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          city_id: number
          title: string
          summary_markdown: string
          effective_date?: string | null
          source_url?: string | null
          is_published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          city_id?: number
          title?: string
          summary_markdown?: string
          effective_date?: string | null
          source_url?: string | null
          is_published?: boolean
          published_at?: string | null
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing'
          plan_name: string
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing'
          plan_name: string
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing'
          plan_name?: string
          current_period_start?: string | null
          current_period_end?: string | null
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          user_id: string
          address_line1: string
          address_line2: string | null
          city_id: number
          postal_code: string | null
          type: 'STR' | 'LTR'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          address_line1: string
          address_line2?: string | null
          city_id: number
          postal_code?: string | null
          type: 'STR' | 'LTR'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          address_line1?: string
          address_line2?: string | null
          city_id?: number
          postal_code?: string | null
          type?: 'STR' | 'LTR'
          updated_at?: string
        }
      }
      property_deadlines: {
        Row: {
          id: string
          property_id: string
          rule_key: string
          due_date: string
          status: 'ok' | 'due_soon' | 'overdue'
          last_notified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          rule_key: string
          due_date: string
          status?: 'ok' | 'due_soon' | 'overdue'
          last_notified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          rule_key?: string
          due_date?: string
          status?: 'ok' | 'due_soon' | 'overdue'
          last_notified_at?: string | null
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          property_id: string
          kind: 'license' | 'insurance' | 'inspection' | 'other'
          file_name: string
          file_url: string
          file_size: number | null
          mime_type: string | null
          expires_on: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          kind: 'license' | 'insurance' | 'inspection' | 'other'
          file_name: string
          file_url: string
          file_size?: number | null
          mime_type?: string | null
          expires_on?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          kind?: 'license' | 'insurance' | 'inspection' | 'other'
          file_name?: string
          file_url?: string
          file_size?: number | null
          mime_type?: string | null
          expires_on?: string | null
          updated_at?: string
        }
      }
      emails_sent: {
        Row: {
          id: string
          user_id: string | null
          kind: 'city_digest' | 'personalized_digest' | 'due_soon' | 'welcome' | 'other'
          city_id: number | null
          subject: string
          recipient_email: string
          status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
          external_id: string | null
          sent_at: string
          delivered_at: string | null
          error_message: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          kind: 'city_digest' | 'personalized_digest' | 'due_soon' | 'welcome' | 'other'
          city_id?: number | null
          subject: string
          recipient_email: string
          status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
          external_id?: string | null
          sent_at?: string
          delivered_at?: string | null
          error_message?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          kind?: 'city_digest' | 'personalized_digest' | 'due_soon' | 'welcome' | 'other'
          city_id?: number | null
          subject?: string
          recipient_email?: string
          status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced'
          external_id?: string | null
          sent_at?: string
          delivered_at?: string | null
          error_message?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}