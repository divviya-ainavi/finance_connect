# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Finance Connect is a marketplace platform connecting finance professionals (workers) with businesses seeking financial services. Built with Vite, React, TypeScript, shadcn/ui, and Tailwind CSS. Uses Supabase for backend (auth, database, edge functions, storage).

## Development Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (Vite)
npm run build      # Production build
npm run build:dev  # Development build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

## Architecture

### User Types & Routes
- **Workers** (`/worker/*`): Finance professionals who create profiles, complete verification, take skills tests
- **Businesses** (`/business/*`): Companies searching for and connecting with workers
- **Admin** (`/admin/*`): Platform administrators managing users, verifications, disputes, reviews

### Key Data Relationships
```
profiles (base table)
├── worker_profiles (1:1 via profile_id)
│   ├── worker_skills, worker_languages, worker_qualifications
│   ├── worker_references, verification_statuses, test_attempts
│   └── id_verifications, qualification_uploads
├── business_profiles (1:1 via profile_id)
└── connection_requests (links workers <-> businesses)
    ├── messages
    └── reviews
```

### Auth Flow
- `src/lib/auth.tsx` - AuthProvider wraps app, provides `useAuth()` hook
- User type (`worker`/`business`) stored in `profiles.user_type`
- Admin auth checked via `user_roles` table with `has_role()` function

### Component Organization
- `src/components/ui/` - shadcn/ui primitives (do not modify directly)
- `src/components/worker/` - Worker profile components (skills, verification, availability)
- `src/components/admin/` - Admin layout and review components
- `src/components/reviews/` - Review system components
- `src/components/location/` - Mapbox/Leaflet location pickers

### Database Enums
Important enums defined in `src/integrations/supabase/types.ts`:
- `finance_role`: accounts_payable, bookkeeper, payroll_clerk, management_accountant, etc.
- `qualification_type`: aat_level_2-4, acca/cima/aca (part_qualified/qualified), degree, masters
- `verification_status`: not_started, in_progress, completed, verified, passed
- `connection_status`: pending, accepted, declined

### Supabase Edge Functions
Located in `supabase/functions/`:
- `create-admin-user` - Create admin accounts
- `send-notification` - Email notifications
- `seed-test-data` - Development data seeding
- `notifications` - General notification handling

### Environment Variables
Required in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key

## Path Aliases
- `@/` maps to `src/` (configured in vite.config.ts and tsconfig)

## Styling
- Tailwind CSS with shadcn/ui components
- Theme colors defined in `src/index.css` as CSS variables
- Use `cn()` from `src/lib/utils.ts` for conditional classes
