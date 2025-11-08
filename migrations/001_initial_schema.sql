-- GTA Compliance Digest - Initial Database Schema
-- This migration creates all core tables with proper relationships and constraints

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cities table - Supported municipalities
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    region TEXT NOT NULL DEFAULT 'GTA',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rules table - Compliance obligations by city
CREATE TABLE rules (
    id SERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    key TEXT NOT NULL, -- 'str_license', 'fire_inspection', 'insurance', etc.
    name TEXT NOT NULL,
    frequency_iso TEXT, -- ISO 8601 duration (P1Y for yearly, P6M for 6 months)
    notes_markdown TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(city_id, key)
);

-- Rule updates table - Admin-curated compliance updates
CREATE TABLE rule_updates (
    id SERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary_markdown TEXT NOT NULL,
    effective_date DATE,
    source_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table - Core user entity (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'paid')),
    city_id INTEGER REFERENCES cities(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions table - Stripe subscription tracking
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing')),
    plan_name TEXT NOT NULL,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Properties table - User properties (paid users only)
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city_id INTEGER NOT NULL REFERENCES cities(id),
    postal_code TEXT,
    type TEXT NOT NULL CHECK (type IN ('STR', 'LTR')), -- Short-term rental or Long-term rental
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Property deadlines table - Calculated compliance deadlines
CREATE TABLE property_deadlines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    rule_key TEXT NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'due_soon', 'overdue')),
    last_notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(property_id, rule_key)
);

-- Documents table - Document storage tracking
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('license', 'insurance', 'inspection', 'other')),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    expires_on DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Emails sent table - Email delivery tracking and audit
CREATE TABLE emails_sent (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    kind TEXT NOT NULL CHECK (kind IN ('city_digest', 'personalized_digest', 'due_soon', 'welcome', 'other')),
    city_id INTEGER REFERENCES cities(id),
    subject TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    external_id TEXT, -- SendGrid message ID
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    error_message TEXT
);

-- Create indexes for performance optimization
CREATE INDEX idx_users_city_id ON users(city_id);
CREATE INDEX idx_users_plan ON users(plan);
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_rules_city_id ON rules(city_id);
CREATE INDEX idx_rules_key ON rules(key);
CREATE INDEX idx_rules_active ON rules(is_active);

CREATE INDEX idx_rule_updates_city_id ON rule_updates(city_id);
CREATE INDEX idx_rule_updates_published ON rule_updates(is_published);
CREATE INDEX idx_rule_updates_effective_date ON rule_updates(effective_date);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_properties_city_id ON properties(city_id);
CREATE INDEX idx_properties_type ON properties(type);

CREATE INDEX idx_property_deadlines_property_id ON property_deadlines(property_id);
CREATE INDEX idx_property_deadlines_due_date ON property_deadlines(due_date);
CREATE INDEX idx_property_deadlines_status ON property_deadlines(status);
CREATE INDEX idx_property_deadlines_rule_key ON property_deadlines(rule_key);

CREATE INDEX idx_documents_property_id ON documents(property_id);
CREATE INDEX idx_documents_kind ON documents(kind);
CREATE INDEX idx_documents_expires_on ON documents(expires_on);

CREATE INDEX idx_emails_sent_user_id ON emails_sent(user_id);
CREATE INDEX idx_emails_sent_kind ON emails_sent(kind);
CREATE INDEX idx_emails_sent_city_id ON emails_sent(city_id);
CREATE INDEX idx_emails_sent_status ON emails_sent(status);
CREATE INDEX idx_emails_sent_sent_at ON emails_sent(sent_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rule_updates_updated_at BEFORE UPDATE ON rule_updates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_deadlines_updated_at BEFORE UPDATE ON property_deadlines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();