# GTA STR Compliance Assistant

A centralized compliance assistant that reads the real municipal by-laws and helps short-term rental hosts stay compliant across Greater Toronto Area municipalities.

## Features

- **Municipality-Specific Rules**: Covers Toronto, Mississauga, Brampton, Vaughan, Newmarket, Hamilton, and Richmond Hill
- **Compliance Assessment**: "Compliant / At-Risk / Likely Non-Compliant" status with plain-language explanations
- **By-law References**: Direct citations to specific sections of municipal by-laws
- **Principal Residence Tracking**: Validates principal residence requirements where applicable
- **License Management**: Tracks STR licenses, registrations, and MAT obligations

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes with Supabase
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Email**: SendGrid

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
4. Fill in your environment variables in `.env.local`
5. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supported Municipalities

- **Toronto**: Municipal Code Chapter 547 (Registration required, principal residence)
- **Mississauga**: By-law 0289-2020 (STR Accommodation License)
- **Brampton**: By-law 165-2021 (Host License, principal residence only)
- **Vaughan**: By-law 158-2019 (Owner license, licensed brokerage requirement)
- **Newmarket**: By-law 2024-68 (4% Municipal Accommodation Tax)
- **Hamilton**: Draft framework (confirm against final by-law)
- **Richmond Hill**: Study document only (not enforceable)

## Project Structure

```
/
├── app/                     # Next.js 14 app directory
├── components/              # Reusable UI components
├── lib/
│   ├── compliance/          # Rule engine and scoring logic
│   ├── supabase/           # Database client
│   └── utils.ts            # Utility functions
├── types/                   # TypeScript type definitions
├── migrations/              # Database migration files
└── tests/                   # Test files
```

## Compliance Engine

The app uses a rule-based engine that:

1. **Identifies Municipality**: Loads specific by-law requirements
2. **Collects Property Data**: Address, usage type, principal residence status, licenses
3. **Applies Rules**: Checks against municipal requirements
4. **Generates Assessment**: Compliance status with specific by-law references
5. **Provides Guidance**: Plain-language explanations and next steps

⚠️ **Important**: This tool is not an official source and does not provide legal advice. Always confirm with the municipality or legal counsel.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks