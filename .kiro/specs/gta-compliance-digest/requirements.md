# Requirements Document

## Introduction

The GTA Compliance Digest is an MVP SaaS platform that helps landlords and property managers stay compliant with municipal regulations across Greater Toronto Area cities. The system provides both free citywide compliance updates and paid property-specific monitoring with deadlines, scoring, and personalized reminders. The goal is to prove market demand with 100+ free subscribers and 5-10 paid subscribers within 90 days.

## Requirements

### Requirement 1: User Registration and Authentication

**User Story:** As a landlord in the GTA, I want to create an account and choose my subscription tier, so that I can access compliance information relevant to my needs.

#### Acceptance Criteria

1. WHEN a user visits the landing page THEN the system SHALL display pricing options for free and paid tiers
2. WHEN a user selects free signup THEN the system SHALL allow them to register with email and select their city
3. WHEN a user selects paid signup THEN the system SHALL redirect them to Stripe checkout
4. WHEN a user completes Stripe checkout THEN the system SHALL create their account and subscription record
5. IF a user is authenticated THEN the system SHALL provide access to tier-appropriate features

### Requirement 2: Free Tier - Citywide Compliance Digest

**User Story:** As a free subscriber, I want to receive email digests when there are new compliance updates for my city, so that I can stay informed about regulatory changes.

#### Acceptance Criteria

1. WHEN new rule updates are published for a city THEN the system SHALL send citywide digest emails to free subscribers in that city
2. WHEN generating a citywide digest THEN the system SHALL include all newly published rule updates since the last digest
3. WHEN generating a citywide digest THEN the system SHALL include upcoming rule changes effective in the next 60 days
4. WHEN a rule update is included THEN the system SHALL provide the title, summary, and link to official source
5. WHEN sending to free users THEN the system SHALL include a call-to-action to upgrade to paid tier
6. IF there are no new updates for a city THEN the system SHALL NOT send a digest to free subscribers

### Requirement 3: Paid Tier - Property Management

**User Story:** As a paid subscriber, I want to add and manage my properties with specific compliance deadlines, so that I can track obligations for each property individually.

#### Acceptance Criteria

1. WHEN a paid user accesses the dashboard THEN the system SHALL display all their properties with compliance scores
2. WHEN a paid user adds a property THEN the system SHALL require address, city, property type, and key compliance dates
3. WHEN a property is added THEN the system SHALL create corresponding deadline records for compliance obligations
4. WHEN a user views a property THEN the system SHALL display next deadlines and current compliance score
5. IF a property has overdue items THEN the system SHALL highlight them prominently

### Requirement 4: Compliance Scoring System

**User Story:** As a paid subscriber, I want to see a compliance score for each property, so that I can quickly assess which properties need attention.

#### Acceptance Criteria

1. WHEN calculating a compliance score THEN the system SHALL start with a base score of 100
2. WHEN an STR license is due within 30 days or missing THEN the system SHALL deduct 20 points
3. WHEN insurance expires within 30 days or missing THEN the system SHALL deduct 20 points
4. WHEN fire inspection is due within 30 days or missing THEN the system SHALL deduct 20 points
5. WHEN any item is overdue THEN the system SHALL deduct 10 points per item with a maximum deduction of 40 points
6. WHEN the calculated score would be negative THEN the system SHALL set the score to 0

### Requirement 5: Personalized Digest and Notifications

**User Story:** As a paid subscriber, I want to receive curated personalized email digests and due-soon notifications for my properties, so that I never miss important compliance deadlines.

#### Acceptance Criteria

1. WHEN it is the 1st of the month at 09:30 ET THEN the system SHALL send personalized digests to paid subscribers
2. WHEN generating a personalized digest THEN the system SHALL include property-specific deadlines due in the next 60 days
3. WHEN generating a personalized digest THEN the system SHALL include compliance scores for each property
4. WHEN generating a personalized digest THEN the system SHALL include relevant city updates that affect the subscriber's properties
5. WHEN it is 09:00 ET daily THEN the system SHALL check for deadlines within 14 days
6. WHEN a deadline is within 14 days AND last notification was >7 days ago THEN the system SHALL send a due-soon alert
7. WHEN sending a due-soon alert THEN the system SHALL update the last_notified_at timestamp

### Requirement 6: Document Management

**User Story:** As a paid subscriber, I want to upload compliance documents for my properties, so that I can track document expiration dates and improve my compliance score.

#### Acceptance Criteria

1. WHEN a paid user uploads a document THEN the system SHALL store it securely in Supabase Storage
2. WHEN storing a document THEN the system SHALL record the document type, property association, and expiration date
3. WHEN accessing documents THEN the system SHALL use signed URLs for secure downloads
4. WHEN a document has an expiration date THEN the system SHALL factor it into compliance scoring
5. IF a user tries to access another user's documents THEN the system SHALL deny access

### Requirement 7: Administrative Content Management

**User Story:** As an administrator, I want to manage cities, rules, and rule updates through an interface, so that I can keep compliance information current across all supported municipalities.

#### Acceptance Criteria

1. WHEN an admin accesses the management interface THEN the system SHALL allow CRUD operations on cities and rules
2. WHEN an admin creates a rule update THEN the system SHALL require title, summary, effective date, and source URL
3. WHEN an admin publishes a rule update THEN the system SHALL make it available for inclusion in digests
4. WHEN adding a new city THEN the system SHALL allow configuration of city-specific rules and frequencies
5. WHEN managing rule updates THEN the system SHALL provide the ability to schedule publication dates

### Requirement 8: Multi-City Support

**User Story:** As a user in any GTA municipality, I want to select my specific city for relevant compliance information, so that I receive only applicable regulations.

#### Acceptance Criteria

1. WHEN the system launches THEN it SHALL support Toronto, Mississauga, Brampton, and Markham
2. WHEN a user selects a city THEN the system SHALL filter all compliance information to that municipality
3. WHEN adding a new city THEN an admin SHALL be able to configure it in under 10 minutes
4. WHEN city-specific rules differ THEN the system SHALL apply the correct rules based on property location
5. IF a rule applies to multiple cities THEN the system SHALL allow efficient management across municipalities

### Requirement 9: Email Deliverability and Compliance

**User Story:** As a user receiving emails, I want reliable delivery with proper unsubscribe options, so that I can manage my email preferences and trust the service.

#### Acceptance Criteria

1. WHEN any email is sent THEN the system SHALL include a functional unsubscribe link
2. WHEN a user unsubscribes THEN the system SHALL immediately stop sending emails of that type
3. WHEN including rule updates THEN the system SHALL provide links to official sources
4. WHEN sending personalized content THEN the system SHALL ensure all merge tags render correctly
5. WHEN emails fail to send THEN the system SHALL retry up to 3 times with exponential backoff

### Requirement 10: Data Security and Privacy

**User Story:** As a user providing personal and property information, I want my data to be secure and private, so that I can trust the platform with sensitive information.

#### Acceptance Criteria

1. WHEN implementing data access THEN the system SHALL use Row Level Security (RLS) policies
2. WHEN a user accesses data THEN they SHALL only see their own properties, documents, and deadlines
3. WHEN storing files THEN the system SHALL use private storage buckets with signed URLs
4. WHEN collecting user data THEN the system SHALL store only essential information (email and address)
5. WHEN providing compliance information THEN the system SHALL include disclaimers that it is not legal advice

### Requirement 11: System Monitoring and Reliability

**User Story:** As a system administrator, I want comprehensive logging and monitoring, so that I can ensure reliable service delivery and quickly resolve issues.

#### Acceptance Criteria

1. WHEN emails are sent THEN the system SHALL log the send status and recipient information
2. WHEN webhooks are received THEN the system SHALL log the event and processing status
3. WHEN scheduled jobs run THEN the system SHALL log execution status and any errors
4. WHEN system metrics are collected THEN they SHALL include signup rates, email engagement, and property counts
5. WHEN critical failures occur THEN the system SHALL send alerts to administrators

### Requirement 12: Payment Processing Integration

**User Story:** As a user wanting paid features, I want secure payment processing with automatic subscription management, so that I can easily upgrade and manage my billing.

#### Acceptance Criteria

1. WHEN a user selects paid tier THEN the system SHALL create a Stripe checkout session
2. WHEN payment is successful THEN Stripe SHALL send a webhook to update subscription status
3. WHEN subscription status changes THEN the system SHALL update user access permissions accordingly
4. WHEN subscription expires THEN the system SHALL downgrade user to free tier
5. IF webhook processing fails THEN the system SHALL retry and log the failure for manual review