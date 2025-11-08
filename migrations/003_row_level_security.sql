-- GTA Compliance Digest - Row Level Security Policies
-- This migration implements comprehensive RLS policies to ensure data isolation

-- Enable RLS on all user-specific tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails_sent ENABLE ROW LEVEL SECURITY;

-- Public tables (cities, rules, rule_updates) remain accessible to all authenticated users
-- but we'll still enable RLS for future flexibility
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_updates ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user ID
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID
LANGUAGE SQL STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.sub', true), ''),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::UUID
$$;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions table policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Properties table policies
CREATE POLICY "Users can view their own properties" ON properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties" ON properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" ON properties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" ON properties
  FOR DELETE USING (auth.uid() = user_id);

-- Property deadlines table policies
CREATE POLICY "Users can view deadlines for their properties" ON property_deadlines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_deadlines.property_id 
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update deadlines for their properties" ON property_deadlines
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_deadlines.property_id 
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all property deadlines" ON property_deadlines
  FOR ALL USING (auth.role() = 'service_role');

-- Documents table policies
CREATE POLICY "Users can view documents for their properties" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = documents.property_id 
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert documents for their properties" ON documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = documents.property_id 
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents for their properties" ON documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = documents.property_id 
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents for their properties" ON documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = documents.property_id 
      AND properties.user_id = auth.uid()
    )
  );

-- Emails sent table policies (users can view emails sent to them)
CREATE POLICY "Users can view emails sent to them" ON emails_sent
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all emails" ON emails_sent
  FOR ALL USING (auth.role() = 'service_role');

-- Public tables policies (allow read access to all authenticated users)
CREATE POLICY "Authenticated users can view cities" ON cities
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view active rules" ON rules
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Authenticated users can view published rule updates" ON rule_updates
  FOR SELECT USING (auth.role() = 'authenticated' AND is_published = true);

-- Admin policies for content management (service role only)
CREATE POLICY "Service role can manage cities" ON cities
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage rules" ON rules
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage rule updates" ON rule_updates
  FOR ALL USING (auth.role() = 'service_role');

-- Create a function to check if user has paid subscription
CREATE OR REPLACE FUNCTION user_has_paid_subscription(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_uuid 
    AND plan = 'paid'
    AND EXISTS (
      SELECT 1 FROM subscriptions 
      WHERE user_id = user_uuid 
      AND status IN ('active', 'trialing')
      AND (current_period_end IS NULL OR current_period_end > NOW())
    )
  );
$$;

-- Enhanced policies for paid features
CREATE POLICY "Only paid users can create properties" ON properties
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND user_has_paid_subscription(auth.uid())
  );

CREATE POLICY "Only paid users can upload documents" ON documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = documents.property_id 
      AND properties.user_id = auth.uid()
      AND user_has_paid_subscription(auth.uid())
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant table permissions to authenticated users
GRANT SELECT ON cities TO authenticated;
GRANT SELECT ON rules TO authenticated;
GRANT SELECT ON rule_updates TO authenticated;

GRANT ALL ON users TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON properties TO authenticated;
GRANT ALL ON property_deadlines TO authenticated;
GRANT ALL ON documents TO authenticated;
GRANT ALL ON emails_sent TO authenticated;

-- Grant full permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Create indexes for RLS performance
CREATE INDEX idx_properties_user_id_rls ON properties(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_property_deadlines_property_user ON property_deadlines(property_id);
CREATE INDEX idx_documents_property_user ON documents(property_id);
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);

-- Create a view for user properties with compliance scores (will be used later)
CREATE OR REPLACE VIEW user_properties_with_scores AS
SELECT 
  p.*,
  c.name as city_name,
  c.slug as city_slug,
  COUNT(pd.id) as total_deadlines,
  COUNT(CASE WHEN pd.status = 'overdue' THEN 1 END) as overdue_count,
  COUNT(CASE WHEN pd.status = 'due_soon' THEN 1 END) as due_soon_count
FROM properties p
JOIN cities c ON p.city_id = c.id
LEFT JOIN property_deadlines pd ON p.id = pd.property_id
WHERE p.user_id = auth.uid()
GROUP BY p.id, c.name, c.slug;

-- Grant access to the view
GRANT SELECT ON user_properties_with_scores TO authenticated;