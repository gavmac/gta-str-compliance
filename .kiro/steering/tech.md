# Technology Stack & Build System

## Core Technologies

### Frontend & Backend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **API**: Next.js API routes for server-side logic
- **Authentication**: Supabase Auth with JWT tokens

### Database & Storage
- **Database**: PostgreSQL via Supabase
- **Storage**: Supabase Storage for document uploads
- **Security**: Row Level Security (RLS) policies for data isolation
- **Migrations**: SQL migration files with proper indexing

### External Services
- **Payments**: Stripe with webhooks for subscription management
- **Email**: SendGrid for transactional emails and digests
- **Scheduling**: Vercel Cron or Supabase Edge Functions
- **Deployment**: Vercel with automatic deployments

## Architecture Principles

- **Ship fast, change-safe**: Typed APIs, database migrations, feature flags
- **Minimal but extensible**: Start simple, design for growth
- **Security by default**: RLS, least-privilege access, audit logging
- **Event-driven notifications**: Emails triggered by compliance updates

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run type-check   # TypeScript validation
npm run lint         # ESLint code quality checks
```

### Database
```bash
npx supabase start   # Start local Supabase
npx supabase db push # Apply migrations
npx supabase db reset # Reset local database
```

### Testing
```bash
npm test             # Run unit tests
npm run test:e2e     # End-to-end tests
npm run test:integration # Integration tests
```

### Deployment
```bash
vercel deploy        # Deploy to preview
vercel --prod        # Deploy to production
```

## Code Quality Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **Validation**: Zod schemas for all API inputs/outputs
- **Error Handling**: Comprehensive error types and logging
- **Testing**: Unit tests for business logic, integration tests for APIs
- **Security**: Input sanitization, RLS policies, secure file handling