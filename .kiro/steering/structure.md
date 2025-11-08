# Project Structure & Organization

## Directory Layout

```
/
├── .kiro/                    # Kiro configuration and specs
│   ├── specs/               # Feature specifications
│   └── steering/            # AI assistant guidance rules
├── .vscode/                 # VSCode workspace settings
├── app/                     # Next.js 14 app directory
│   ├── (auth)/             # Authentication pages group
│   ├── (dashboard)/        # Protected dashboard pages
│   ├── admin/              # Administrative interface
│   ├── api/                # API route handlers
│   ├── globals.css         # Global styles and Tailwind imports
│   ├── layout.tsx          # Root layout component
│   └── page.tsx            # Landing page
├── components/             # Reusable UI components
│   ├── ui/                 # Base UI components (buttons, forms)
│   ├── auth/               # Authentication-specific components
│   ├── dashboard/          # Dashboard-specific components
│   └── email/              # Email template components
├── lib/                    # Utility libraries and configurations
│   ├── supabase/           # Supabase client and utilities
│   ├── stripe/             # Stripe integration utilities
│   ├── email/              # Email service and templates
│   ├── compliance/         # Compliance scoring and calculations
│   └── utils.ts            # General utility functions
├── types/                  # TypeScript type definitions
├── migrations/             # Database migration files
├── tests/                  # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
└── public/                 # Static assets
```

## Code Organization Principles

### Component Structure
- **UI Components**: Reusable, unstyled base components in `components/ui/`
- **Feature Components**: Domain-specific components grouped by feature
- **Page Components**: Route-specific components in app directory
- **Email Templates**: Separate components for email generation

### API Organization
- **Route Handlers**: RESTful endpoints in `app/api/`
- **Middleware**: Authentication and validation middleware
- **Utilities**: Business logic separated from route handlers
- **Types**: Shared TypeScript interfaces and schemas

### Database Structure
- **Migrations**: Sequential SQL files with proper rollback support
- **Seed Data**: Initial data for cities, rules, and test content
- **RLS Policies**: Security policies defined alongside table schemas
- **Indexes**: Performance optimization for common queries

## Naming Conventions

### Files and Directories
- **kebab-case**: For directories and non-component files
- **PascalCase**: For React components and TypeScript types
- **camelCase**: For utility functions and variables
- **UPPER_CASE**: For environment variables and constants

### Database Schema
- **snake_case**: For table names, column names, and database identifiers
- **Descriptive names**: Clear, unambiguous naming for all entities
- **Consistent prefixes**: Related tables share common prefixes where appropriate

### API Endpoints
- **RESTful conventions**: Standard HTTP methods and resource naming
- **Versioning**: API version in URL path when needed
- **Consistent responses**: Standardized error and success response formats

## Development Workflow

### Feature Development
1. Create or update specifications in `.kiro/specs/`
2. Implement database migrations if needed
3. Build API endpoints with proper validation
4. Create UI components and pages
5. Add comprehensive tests
6. Update documentation

### Code Quality
- **TypeScript strict mode**: No implicit any, proper type definitions
- **ESLint configuration**: Consistent code style and best practices
- **Prettier formatting**: Automatic code formatting
- **Pre-commit hooks**: Automated quality checks before commits

### Security Considerations
- **RLS policies**: Every table has appropriate security policies
- **Input validation**: All user inputs validated with Zod schemas
- **File uploads**: Secure handling with type and size validation
- **API authentication**: Protected routes require valid JWT tokens