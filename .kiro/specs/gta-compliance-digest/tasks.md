# Implementation Plan

- [x] 1. Project Setup and Core Infrastructure
  - Initialize Next.js 14 project with TypeScript and Tailwind CSS
  - Configure Supabase client and environment variables
  - Set up database schema with migrations and RLS policies
  - Create basic project structure with folders for components, pages, and utilities
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 2. Database Schema and Security Implementation
  - [x] 2.1 Create core database tables and relationships
    - Implement users, subscriptions, cities, rules, rule_updates, properties, property_deadlines, documents, and emails_sent tables
    - Write SQL migration files with proper foreign key constraints
    - Add database indexes for performance optimization
    - _Requirements: 3.2, 3.3, 8.2, 11.1_

  - [x] 2.2 Implement Row Level Security policies
    - Create RLS policies ensuring users can only access their own properties, documents, and deadlines
    - Write tests to verify RLS policies prevent unauthorized data access
    - Configure service role permissions for admin operations
    - _Requirements: 10.1, 10.2, 6.5_

- [x] 3. Authentication System Implementation
  - [x] 3.1 Set up Supabase Auth integration
    - Create signup and signin pages with form validation
    - Implement authentication state management and session handling
    - Add protected route middleware for authenticated pages
    - Write unit tests for authentication utilities
    - _Requirements: 1.2, 1.3, 1.5_

  - [x] 3.2 Create user registration flow with city selection
    - Build city selector component for free tier signup
    - Implement user profile creation with selected city association
    - Add form validation and error handling for registration
    - Write integration tests for complete signup flow
    - _Requirements: 1.2, 8.3_

- [-] 4. Stripe Payment Integration
  - [x] 4.1 Implement Stripe checkout flow
    - Create checkout session API endpoint for paid tier signup
    - Build payment page with Stripe Elements integration
    - Add loading states and error handling for payment flow
    - Write tests for checkout session creation
    - _Requirements: 1.4, 12.1, 12.2_

  - [x] 4.2 Set up Stripe webhook handling
    - Create webhook endpoint to process subscription events
    - Implement subscription status updates in database
    - Add webhook signature verification and error handling
    - Write tests for webhook event processing
    - _Requirements: 12.2, 12.3, 12.4, 12.5_

- [ ] 5. Compliance Scoring Engine
  - [ ] 5.1 Implement compliance scoring algorithm
    - Create scoring function with base 100 point system
    - Implement deduction logic for due dates and overdue items
    - Add unit tests to verify deterministic scoring behavior
    - Create scoring utilities for different property types
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 5.2 Build deadline calculation system
    - Implement deadline generation based on property type and city rules
    - Create utilities to calculate due dates from rule frequencies
    - Add status calculation (ok, due_soon, overdue) based on current date
    - Write comprehensive tests for deadline calculations
    - _Requirements: 3.3, 5.6_

- [ ] 6. Property Management System (Paid Users)
  - [ ] 6.1 Create property CRUD operations
    - Build API endpoints for creating, reading, updating, and deleting properties
    - Implement property form with address, city, and type validation
    - Add property list view with compliance scores and next deadlines
    - Write integration tests for property management operations
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 6.2 Implement property dashboard
    - Create dashboard component displaying all user properties
    - Add compliance score visualization with color coding
    - Implement property detail view with deadline timeline
    - Build responsive design for mobile and desktop
    - _Requirements: 3.1, 3.4, 3.5_

- [ ] 7. Document Management System
  - [ ] 7.1 Implement secure file upload
    - Create document upload API with Supabase Storage integration
    - Add file type validation and size limits
    - Implement progress indicators and error handling for uploads
    - Write tests for file upload and validation logic
    - _Requirements: 6.1, 6.2, 6.5_

  - [ ] 7.2 Build document management interface
    - Create document list view with expiration date tracking
    - Implement secure download using signed URLs
    - Add document deletion with confirmation dialogs
    - Build document association with properties and compliance rules
    - _Requirements: 6.3, 6.4_

- [ ] 8. Email System Implementation
  - [ ] 8.1 Create email template system
    - Build base email template with header, footer, and unsubscribe links
    - Create city digest template for rule updates with source links
    - Implement personalized digest template with property information
    - Add due-soon notification template for urgent deadlines
    - Write tests for template rendering with merge tags
    - _Requirements: 2.4, 5.2, 5.3, 9.1, 9.4_

  - [ ] 8.2 Implement email delivery system
    - Create SendGrid integration for transactional emails
    - Add email queue system with retry logic and exponential backoff
    - Implement unsubscribe handling and preference management
    - Build email delivery tracking and logging
    - Write integration tests for email sending and delivery
    - _Requirements: 9.2, 9.5, 11.1_

- [ ] 9. Scheduled Email Jobs
  - [ ] 9.1 Create city digest email job
    - Implement job to send digests when new rule updates are published
    - Add logic to identify subscribers by city and send targeted emails
    - Include upgrade CTA for free users in digest emails
    - Write tests for digest generation and recipient targeting
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_

  - [ ] 9.2 Build personalized digest system
    - Create monthly personalized digest job for paid subscribers
    - Implement property-specific deadline aggregation and scoring
    - Add relevant city updates that affect subscriber properties
    - Write tests for personalized content generation
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 9.3 Implement due-soon notification system
    - Create daily job to check for deadlines within 14 days
    - Add logic to prevent duplicate notifications using last_notified_at
    - Implement minimal alert email format for urgent deadlines
    - Write tests for notification timing and deduplication
    - _Requirements: 5.5, 5.6, 5.7_

- [ ] 10. Administrative Content Management
  - [ ] 10.1 Create admin interface for cities and rules
    - Build admin pages for managing cities with CRUD operations
    - Implement rules management with frequency configuration
    - Add validation for city slugs and rule keys
    - Write tests for admin operations and data validation
    - _Requirements: 7.1, 7.4, 8.3_

  - [ ] 10.2 Build rule updates management system
    - Create interface for creating and editing rule updates
    - Implement draft/publish workflow with publication scheduling
    - Add rich text editor for update summaries with markdown support
    - Build preview functionality for rule updates before publishing
    - Write tests for content management and publishing workflow
    - _Requirements: 7.2, 7.3_

- [ ] 11. Multi-City Support System
  - [ ] 11.1 Implement city-specific rule configuration
    - Create system to associate rules with specific cities
    - Add support for city-specific rule frequencies and requirements
    - Implement rule inheritance and override capabilities
    - Write tests for city-specific rule application
    - _Requirements: 8.1, 8.2, 8.4_

  - [ ] 11.2 Build efficient city management tools
    - Create streamlined interface for adding new cities
    - Implement bulk rule setup for new municipalities
    - Add city activation/deactivation functionality
    - Build tools to duplicate rules across similar cities
    - Write tests to verify new city setup can be completed in under 10 minutes
    - _Requirements: 8.3, 8.5_

- [ ] 12. System Monitoring and Analytics
  - [ ] 12.1 Implement comprehensive logging system
    - Add logging for all email sends with status and recipient information
    - Create webhook event logging with processing status
    - Implement scheduled job execution logging with error tracking
    - Build audit trail for all administrative actions
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ] 12.2 Create analytics and monitoring dashboard
    - Build metrics collection for signup rates and email engagement
    - Implement property count tracking and compliance score analytics
    - Add system health monitoring with error rate tracking
    - Create alerting system for critical failures and webhook issues
    - Write tests for metrics collection and alert triggering
    - _Requirements: 11.4, 11.5_

- [ ] 13. Landing Page and Public Interface
  - [ ] 13.1 Build marketing landing page
    - Create responsive landing page with pricing information
    - Implement city selector for free tier signup
    - Add testimonials section and feature comparison table
    - Build contact form and FAQ section
    - Write tests for landing page functionality and form submissions
    - _Requirements: 1.1_

  - [ ] 13.2 Create public API endpoints
    - Build public endpoints for city information and recent updates
    - Implement rate limiting and caching for public endpoints
    - Add API documentation and usage examples
    - Write integration tests for public API functionality
    - _Requirements: 8.1_

- [ ] 14. Testing and Quality Assurance
  - [ ] 14.1 Implement comprehensive test suite
    - Create unit tests for all business logic and utilities
    - Build integration tests for API endpoints and database operations
    - Add end-to-end tests for critical user journeys
    - Implement performance tests for email generation and database queries
    - _Requirements: All requirements validation_

  - [ ] 14.2 Add security testing and validation
    - Create tests to verify RLS policies prevent unauthorized access
    - Implement input sanitization tests for all user inputs
    - Add file upload security tests with malicious file detection
    - Build API security tests for rate limiting and authentication
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 15. Deployment and Production Setup
  - [ ] 15.1 Configure production environment
    - Set up Vercel deployment with environment variables
    - Configure Supabase production database with backups
    - Set up SendGrid production account with domain authentication
    - Configure Stripe production webhooks and API keys
    - _Requirements: System reliability and security_

  - [ ] 15.2 Implement monitoring and error tracking
    - Add error tracking with Sentry or similar service
    - Configure uptime monitoring for critical endpoints
    - Set up database performance monitoring
    - Create deployment pipeline with automated testing
    - _Requirements: 11.4, 11.5_

- [ ] 16. Data Seeding and Initial Content
  - [ ] 16.1 Create seed data for initial cities
    - Add Toronto, Mississauga, Brampton, and Markham to cities table
    - Create initial rule sets for each city (STR license, fire inspection, insurance, MAT, MRAB)
    - Add sample rule updates for testing email functionality
    - Write scripts for easy data seeding in development and production
    - _Requirements: 8.1, 8.4_

  - [ ] 16.2 Build content migration tools
    - Create tools for importing existing compliance data
    - Build utilities for bulk rule update creation
    - Add data validation and cleanup scripts
    - Implement backup and restore functionality for content
    - _Requirements: 7.1, 7.2_