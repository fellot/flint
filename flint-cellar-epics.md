# Flint Cellar — Epic & User Story Breakdown

> Production-grade wine cellar web app deployed on Vercel with Supabase backend.
> Freemium model: 25 bottles free, membership required for more.

---

## Epic 1: Project Scaffolding & Infrastructure

Set up the foundational project structure, CI/CD pipeline, and core configuration needed before any feature work begins.

### User Stories

**1.1 — Initialize Next.js Project**
As a developer, I want a Next.js 14+ (App Router) project with TypeScript, Tailwind CSS, and ESLint configured so that all subsequent work follows consistent patterns.
**Acceptance Criteria:**
- `npx create-next-app@latest` with TypeScript, Tailwind, App Router
- Folder structure: `app/`, `components/`, `lib/`, `types/`, `utils/`, `hooks/`
- Path aliases configured (`@/`)
- `.env.local.example` with all required env vars documented
- `README.md` with local dev setup instructions

**1.2 — Configure Supabase Project**
As a developer, I want a Supabase project provisioned with a Postgres database, Row Level Security (RLS) enabled, and the Supabase JS client configured so the app can securely read/write data.
**Acceptance Criteria:**
- Supabase project created with auth, database, and storage enabled
- `@supabase/supabase-js` installed
- Singleton Supabase client helper in `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (server components / route handlers)
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Connection verified with a health check query

**1.3 — Deploy to Vercel**
As a developer, I want the repo connected to Vercel with preview deployments on PRs and production deployments on `main` so every change is testable in a real environment.
**Acceptance Criteria:**
- GitHub repo linked to Vercel project
- Environment variables set in Vercel dashboard
- Preview deployments auto-created for PRs
- Production deployment triggered on `main` merge
- Custom domain configured (if available)

**1.4 — Set Up Database Schema & Migrations**
As a developer, I want a migration system using Supabase CLI so the database schema is version-controlled and reproducible.
**Acceptance Criteria:**
- `supabase init` and `supabase link` configured
- Initial migration creates all core tables (see Epic 2)
- `supabase db push` applies migrations to remote
- Seed script for development data
- Schema types auto-generated with `supabase gen types typescript`

**1.5 — Configure Vercel Analytics & Error Tracking**
As a developer, I want Vercel Analytics and basic error tracking so I can monitor performance and catch issues in production.
**Acceptance Criteria:**
- `@vercel/analytics` installed and integrated
- Core Web Vitals tracked
- Consider Sentry or similar for error reporting (optional for MVP)

---

## Epic 2: Database Design & Data Layer

Define all Supabase tables, RLS policies, and the data access layer that powers the application.

### User Stories

**2.1 — Create Users & Profiles Table**
As a developer, I want a `profiles` table linked to Supabase Auth so user-specific data (display name, avatar, preferences, language) is stored and protected by RLS.
**Acceptance Criteria:**
- `profiles` table with: `id` (FK to `auth.users`), `display_name`, `avatar_url`, `language` (default: `'en'`), `created_at`, `updated_at`
- Auto-create profile via database trigger on auth user creation
- RLS: users can only read/update their own profile

**2.2 — Create Wines Table**
As a developer, I want a `wines` table that captures all wine attributes so users can store their full collection.
**Acceptance Criteria:**
- Table columns: `id` (uuid), `user_id` (FK), `bottle` (name), `country`, `region`, `vintage`, `drinking_window`, `peak_year`, `food_pairing_notes`, `meal_suggestion`, `style` (enum: red, white, rosé, sparkling, dessert, fortified, orange), `grapes`, `status` (enum: in_cellar, consumed, sold, gifted), `consumed_date`, `notes`, `rating` (1-5), `price`, `location`, `quantity`, `technical_sheet_url`, `bottle_image_url`, `from_cellar` (boolean), `coravin` (boolean), `coravin_date`, `created_at`, `updated_at`
- Indexes on: `user_id`, `status`, `country`, `style`, `vintage`
- RLS: users can only CRUD their own wines

**2.3 — Create Subscriptions & Billing Table**
As a developer, I want a `subscriptions` table so the app can track each user's plan status and enforce the free-tier bottle limit.
**Acceptance Criteria:**
- Table columns: `id`, `user_id` (FK), `plan` (enum: free, premium), `status` (enum: active, cancelled, expired, past_due), `stripe_customer_id`, `stripe_subscription_id`, `current_period_start`, `current_period_end`, `created_at`, `updated_at`
- Default plan: `free`
- RLS: users can only read their own subscription
- Service role can update from webhook handlers

**2.4 — Create Data Access Layer (DAL)**
As a developer, I want a clean DAL module in `lib/dal/` so all database operations are centralized, typed, and testable.
**Acceptance Criteria:**
- `lib/dal/wines.ts` — CRUD operations for wines
- `lib/dal/profiles.ts` — profile read/update
- `lib/dal/subscriptions.ts` — subscription read/check
- All functions accept the Supabase client as a parameter
- Full TypeScript types generated from the schema
- Error handling with typed error responses

**2.5 — Create Wine Count Enforcement Function**
As a developer, I want a Postgres function or RLS policy that prevents free-tier users from inserting more than 25 wines (with status `in_cellar`) so the limit is enforced at the database level.
**Acceptance Criteria:**
- Postgres function `check_wine_limit()` called via trigger on insert
- Counts wines where `status = 'in_cellar'` for the user
- Raises exception if count >= 25 and user plan = `free`
- Premium users have no limit
- Unit test with Supabase test helpers

---

## Epic 3: Authentication & User Management

Implement Supabase Auth with social login, session management, and protected routes.

### User Stories

**3.1 — Implement Supabase Auth with Email/Password**
As a user, I want to sign up and log in with my email and password so I can access my personal wine cellar.
**Acceptance Criteria:**
- Sign up page at `/signup`
- Login page at `/login`
- Email confirmation flow enabled
- Password reset flow (`/forgot-password`, `/reset-password`)
- Session persisted via Supabase Auth helpers for Next.js
- Redirect to `/` after successful login

**3.2 — Implement Social Login (Google, Apple)**
As a user, I want to sign in with Google or Apple so I don't need to remember another password.
**Acceptance Criteria:**
- Google OAuth configured in Supabase
- Apple OAuth configured in Supabase
- Social login buttons on login/signup pages
- Profile auto-populated from social provider data
- Account linking if email already exists

**3.3 — Build Auth Middleware & Route Protection**
As a developer, I want Next.js middleware that protects all routes except public pages so unauthenticated users are redirected to login.
**Acceptance Criteria:**
- Middleware in `middleware.ts` using `@supabase/ssr`
- Public routes: `/login`, `/signup`, `/forgot-password`, `/`, landing page
- Protected routes: `/cellar`, `/journal`, `/sommelier`, `/map`, `/settings`, `/api/*` (except auth routes)
- Session refresh on every request
- Redirect to intended page after login

**3.4 — Build User Settings Page**
As a user, I want a settings page where I can update my profile, change my password, and manage my preferences.
**Acceptance Criteria:**
- Settings page at `/settings`
- Edit display name, avatar
- Change password
- Language preference (English / Portuguese)
- Delete account with confirmation
- View current subscription status

---

## Epic 4: Core Wine Cellar CRUD

The primary feature — managing wines in the cellar. This is the heart of the application.

### User Stories

**4.1 — Build Wine Dashboard Page**
As a user, I want to see all my in-cellar wines in a sortable, searchable table so I can quickly find any bottle.
**Acceptance Criteria:**
- Page at `/cellar` showing wines where `status = 'in_cellar'`
- Table columns: Bottle, Country, Region, Vintage, Style, Grapes, Peak Year, Quantity, Price, Location
- Sortable by: Bottle (alpha), Vintage, Peak Year, Country, Price
- Global search across: bottle name, country, region, grapes, pairing notes
- Empty state with call-to-action to add first wine
- Wine count displayed prominently
- Responsive: table on desktop, card layout on mobile

**4.2 — Build Wine Filter System**
As a user, I want to filter my cellar by country, region, style, vintage, and Coravin status so I can narrow down my options.
**Acceptance Criteria:**
- Filter bar with dropdowns: Country, Region, Style, Vintage
- Region dropdown dynamically filtered by selected country
- Active filters displayed as removable chips
- "Clear all filters" button
- Filters applied client-side for instant response
- Filter state preserved in URL search params

**4.3 — Build Add Wine Form (Manual)**
As a user, I want to manually add a wine to my cellar by filling out a form so I can track bottles I acquire.
**Acceptance Criteria:**
- Modal or slide-over with form fields for all wine attributes
- Required fields: bottle name, country, style, quantity
- Optional fields: region, vintage, grapes, drinking window, peak year, price, location, notes, food pairing, meal suggestion, technical sheet URL, bottle image URL
- Form validation with inline error messages
- Success toast on save
- Free-tier users see remaining bottle count ("3 of 25 bottles used")
- Blocked with upgrade prompt at 25 bottles

**4.4 — Build Edit Wine Modal**
As a user, I want to edit any wine's details so I can correct mistakes or update information.
**Acceptance Criteria:**
- Click wine row → opens edit modal pre-populated with current data
- All fields editable
- Save updates the record and refreshes the table
- Cancel discards changes
- Optimistic UI update

**4.5 — Implement Delete Wine**
As a user, I want to delete a wine from my cellar so I can remove entries added by mistake.
**Acceptance Criteria:**
- Delete button on edit modal and table row (with confirmation dialog)
- "Are you sure?" confirmation with wine name displayed
- Hard delete from database
- Toast confirmation on success

**4.6 — Implement Consume / Mark Status Actions**
As a user, I want to mark a wine as consumed, sold, or gifted so my cellar reflects only what I currently have.
**Acceptance Criteria:**
- Quick "Consume" action on table row
- Status change modal with: status dropdown (consumed, sold, gifted), date, rating (1-5 stars), tasting notes, location (Wine Heaven / Wine Hell)
- When consumed: original wine `status` updated, `consumed_date` set
- Quantity handling: if quantity > 1, decrement quantity and create a copy with status = consumed and quantity = 1
- Consumed wines disappear from cellar view, appear in journal

**4.7 — Build Cellar Statistics Dashboard**
As a user, I want to see summary statistics about my cellar so I can understand my collection at a glance.
**Acceptance Criteria:**
- Stats cards: Total Bottles, Countries, Styles, Average Vintage
- Expandable breakdown by country → region
- Style distribution (Red, White, Sparkling, etc.)
- Vintage range chart
- Responsive layout: horizontal on desktop, stacked on mobile

---

## Epic 5: Cellar Journal (Consumption History)

Track wines that have been consumed, sold, or gifted — the "history" of the cellar.

### User Stories

**5.1 — Build Cellar Journal Page**
As a user, I want to see a history of wines I've consumed, sold, or gifted so I can remember my experiences.
**Acceptance Criteria:**
- Page at `/journal`
- Sections: Wine Heaven (highly rated consumed), Wine Hell (poorly rated consumed), Sold, Gifted
- Same table/card format as cellar
- Sortable and searchable
- Filter by year consumed, rating, style

**5.2 — Add External Wine to Journal**
As a user, I want to log wines I drank at restaurants or friends' homes (not from my cellar) so my journal is complete.
**Acceptance Criteria:**
- "Add External Wine" button on journal page
- Form with: wine name, date, location (restaurant/event name), rating, notes, style, country
- Saved with `from_cellar = false` flag
- Visually distinguished from cellar wines in the journal

**5.3 — Wine Heaven & Wine Hell Classification**
As a user, I want my consumed wines automatically categorized into Wine Heaven (great) and Wine Hell (bad) so I know what to buy again or avoid.
**Acceptance Criteria:**
- Wine Heaven: rating >= 4 stars
- Wine Hell: rating <= 2 stars
- Middle ground (3 stars): listed in a general "Consumed" section
- Visual indicators (emoji or icons) for each category
- Location field auto-set based on rating

---

## Epic 6: AI-Powered Features

Leverage AI for wine recognition, recommendations, and food pairings.

### User Stories

**6.1 — Build AI Wine Label Scanner**
As a user, I want to take a photo of a wine bottle label and have the app automatically extract the wine details so adding wines is effortless.
**Acceptance Criteria:**
- "Scan Label" button opens camera/file upload
- Image sent to API route → OpenAI Vision API (GPT-4o-mini)
- AI extracts: wine name, vintage, style, grapes, region, country, food pairings
- Pre-populated form shown for user confirmation/editing
- User can save or discard
- Loading state with progress indicator
- Error handling for unreadable labels

**6.2 — Build AI Sommelier Chat**
As a user, I want to chat with an AI sommelier that knows my cellar so I can get personalized wine recommendations for any occasion.
**Acceptance Criteria:**
- Page at `/sommelier` and floating widget on cellar page
- Chat interface: message input, conversation history, AI responses
- AI receives the user's full wine list as context
- Recommendations based on: food pairing, occasion, mood, weather, guests
- Responses include: specific bottle from cellar, serving temp, decanting time, glass type
- Follow-up questions supported
- Bilingual: English and Portuguese based on user preference
- API route: `POST /api/ai/sommelier`

**6.3 — Build AI Food Pairing Enrichment**
As a user, I want AI-suggested food pairings for any wine in my cellar so I know what to cook.
**Acceptance Criteria:**
- "Suggest Pairings" button on wine detail view
- AI generates: general pairing notes + specific meal suggestion
- User can accept suggestions (saved to wine record) or dismiss
- API route: `POST /api/ai/enrich-pairing`

**6.4 — Implement Bottle Image & Technical Sheet Lookup**
As a developer, I want the app to automatically find bottle images and technical sheets for wines added via AI so the cellar looks polished.
**Acceptance Criteria:**
- After AI extraction, search Bing Image API for bottle photo
- Search Bing Web API for PDF technical/fact sheets
- Filter out marketplace sites (Pinterest, AliExpress, eBay)
- Store URLs on the wine record
- Fallback gracefully if APIs are unavailable

---

## Epic 7: Wine Map Visualization

Interactive map showing where wines in the cellar originate.

### User Stories

**7.1 — Build Wine Map Page**
As a user, I want to see my wines plotted on a world map by country and region so I can visualize the diversity of my collection.
**Acceptance Criteria:**
- Page at `/map`
- Interactive map using Leaflet + React Leaflet
- Markers for each wine's country/region
- Cluster markers when multiple wines share a region
- Popup on marker click: wine count, list of wines from that region
- Click-through to filtered cellar view
- Stats sidebar: total countries, total regions, top countries
- Region coordinates mapping utility

---

## Epic 8: Wine Trivia Game

Gamification feature for wine education and engagement.

### User Stories

**8.1 — Build Wine Trivia Game**
As a user, I want to test my wine knowledge with trivia questions so I can learn while being entertained.
**Acceptance Criteria:**
- Page at `/trivia`
- Multiple question sets (4 sets of 15 questions)
- Multiple choice format
- Progress tracking per set
- Score display at end of each set
- Bilingual: English and Portuguese
- Set selection UI with completion badges
- Trivia data stored in Supabase (or static JSON loaded at build time)

---

## Epic 9: Freemium Model & Stripe Integration

Implement the business model: free tier (25 bottles) and paid membership.

### User Stories

**9.1 — Implement Free Tier Bottle Limit (UI)**
As a free user, I want to see how many bottles I've used out of 25 so I know when I'm approaching the limit.
**Acceptance Criteria:**
- Progress bar or counter on cellar page: "12 / 25 bottles"
- Warning at 20 bottles: "You're running low on free bottles"
- Upgrade prompt at 25 bottles: blocks "Add Wine" with upgrade CTA
- Limit applies only to `in_cellar` wines (consumed/sold/gifted don't count)

**9.2 — Build Pricing Page**
As a user, I want to see what I get with a premium membership so I can decide whether to upgrade.
**Acceptance Criteria:**
- Page at `/pricing`
- Feature comparison: Free vs Premium
- Free: 25 bottles, basic features, sommelier (limited), trivia
- Premium: unlimited bottles, AI label scanner, full sommelier, priority support
- Monthly and annual pricing options
- CTA buttons to start checkout

**9.3 — Integrate Stripe Checkout**
As a user, I want to pay for a premium membership via Stripe so I can unlock unlimited bottles.
**Acceptance Criteria:**
- Stripe Checkout session created via API route
- Redirect to Stripe-hosted payment page
- Success page at `/checkout/success`
- Cancel page at `/checkout/cancel`
- Stripe Customer created and linked to Supabase user
- Subscription ID stored in `subscriptions` table

**9.4 — Implement Stripe Webhook Handler**
As a developer, I want Stripe webhooks processed so subscription status stays in sync with payments.
**Acceptance Criteria:**
- Webhook endpoint at `/api/webhooks/stripe`
- Handles: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Updates `subscriptions` table on each event
- Webhook signature verification
- Idempotent processing

**9.5 — Build Subscription Management Portal**
As a premium user, I want to manage my subscription (cancel, update payment, view invoices) from within the app.
**Acceptance Criteria:**
- Settings page section for subscription management
- Link to Stripe Customer Portal for self-service
- Display: current plan, renewal date, payment method (last 4 digits)
- Cancel with confirmation and explanation of what happens
- Graceful downgrade: if user cancels, premium features remain until period end
- At period end: wines over 25 become read-only (not deleted)

---

## Epic 10: Mobile Experience & Responsive Design

Ensure the app works beautifully on phones and tablets.

### User Stories

**10.1 — Build Responsive Layout Shell**
As a user, I want the app to look great on my phone so I can check my cellar at a wine shop or restaurant.
**Acceptance Criteria:**
- Mobile-first responsive layout
- Bottom navigation bar on mobile, sidebar on desktop
- Collapsible sections for statistics
- Touch-friendly tap targets (min 44px)
- No horizontal scrolling

**10.2 — Build Mobile Wine Card Layout**
As a mobile user, I want wines displayed as cards instead of a table so they're easy to read and interact with.
**Acceptance Criteria:**
- Card view for screens < 768px
- Card shows: wine name, vintage, country flag, style badge, quantity
- Tap to expand: full details + actions
- Swipe actions: quick consume, edit
- Smooth transitions

**10.3 — Optimize Camera/Image Upload for Mobile**
As a mobile user, I want the AI label scanner to use my phone's camera directly so I can scan bottles on the spot.
**Acceptance Criteria:**
- `<input type="file" accept="image/*" capture="environment">`
- Camera opens directly on mobile
- Image compressed before upload (max 1MB)
- Progress indicator during upload and AI processing

---

## Epic 11: Internationalization (i18n)

Support English and Portuguese throughout the application.

### User Stories

**11.1 — Set Up i18n Framework**
As a developer, I want a localization system so all user-facing text can be translated.
**Acceptance Criteria:**
- `next-intl` or similar library configured
- Translation files: `messages/en.json`, `messages/pt.json`
- Language detected from user profile preference
- Language switcher in settings and header
- All static text extracted to translation keys

**11.2 — Translate All UI Strings**
As a Portuguese-speaking user, I want the entire app available in Portuguese so I can use it in my native language.
**Acceptance Criteria:**
- All page titles, labels, buttons, placeholders, error messages translated
- Date/number formatting follows locale
- Wine styles translated (but wine names remain original)
- AI sommelier responds in user's preferred language

---

## Epic 12: Landing Page & Marketing

Public-facing pages to attract and convert users.

### User Stories

**12.1 — Build Landing Page**
As a visitor, I want to see what Flint Cellar offers so I can decide whether to sign up.
**Acceptance Criteria:**
- Public page at `/`
- Hero section with value proposition and CTA
- Feature highlights with screenshots/mockups
- Pricing summary
- Testimonials section (placeholder for MVP)
- Footer with links
- SEO optimized: meta tags, Open Graph, structured data

**12.2 — Build Onboarding Flow**
As a new user, I want a guided introduction after signing up so I know how to use the app.
**Acceptance Criteria:**
- 3-4 step onboarding wizard after first login
- Steps: Welcome → Add your first wine (manual or AI scan) → Explore features → Done
- Skip option available
- Onboarding completion stored in profile
- Only shown once

---

## Epic 13: Data Import & Export

Help users migrate existing collections and back up their data.

### User Stories

**13.1 — Build Excel/CSV Import**
As a user, I want to import my wine collection from a spreadsheet so I don't have to enter each bottle manually.
**Acceptance Criteria:**
- Import page or modal accessible from cellar
- Accept `.xlsx`, `.csv`, `.tsv` files
- Column mapping UI: match spreadsheet columns to wine fields
- Preview of first 5 rows before import
- Validation: skip invalid rows with error report
- Respect free-tier limit (import up to 25 for free users)
- Progress bar for large imports

**13.2 — Build Data Export**
As a user, I want to export my cellar data as CSV or Excel so I have a backup.
**Acceptance Criteria:**
- Export button on cellar page
- Formats: CSV, XLSX
- Includes all wine fields
- Respects current filters (export filtered view)
- Downloads immediately to browser

---

## Epic 14: Testing, Performance & Quality

Ensure the application is reliable, fast, and maintainable.

### User Stories

**14.1 — Set Up Testing Framework**
As a developer, I want unit and integration tests so changes don't break existing features.
**Acceptance Criteria:**
- Vitest or Jest configured for unit tests
- React Testing Library for component tests
- Playwright or Cypress for E2E tests
- CI pipeline runs tests on every PR
- Minimum coverage targets defined

**14.2 — Write Core Feature Tests**
As a developer, I want tests for critical paths so the most important flows are always verified.
**Acceptance Criteria:**
- Auth flow: signup, login, logout, protected routes
- Wine CRUD: add, edit, delete, consume
- Bottle limit enforcement
- Stripe webhook processing
- AI endpoints (mocked)
- Filter and search functionality

**14.3 — Performance Optimization**
As a user, I want the app to load fast so I'm not waiting around.
**Acceptance Criteria:**
- Lighthouse score > 90 on all metrics
- Dynamic imports for heavy components (map, charts)
- Image optimization via Next.js Image component
- Database queries indexed and efficient
- Client-side caching with SWR or React Query
- Bundle size analyzed and minimized

**14.4 — Accessibility Audit**
As a user with disabilities, I want the app to be accessible so I can use it with assistive technologies.
**Acceptance Criteria:**
- WCAG 2.1 AA compliance
- Keyboard navigation for all interactive elements
- Screen reader labels on icons and actions
- Color contrast ratios meet standards
- Focus management in modals
- `aria-*` attributes on dynamic content

---

## Suggested Implementation Order

| Phase | Epics | Milestone |
|-------|-------|-----------|
| **Phase 1 — Foundation** | 1, 2, 3 | Users can sign up, log in, and the database is ready |
| **Phase 2 — Core Product** | 4, 5 | Users can manage their wine cellar and view consumption history |
| **Phase 3 — Intelligence** | 6 | AI label scanner, sommelier, and food pairings work |
| **Phase 4 — Monetization** | 9 | Free tier enforced, Stripe payments live |
| **Phase 5 — Polish** | 7, 8, 10, 11 | Map, trivia, mobile experience, and i18n complete |
| **Phase 6 — Growth** | 12, 13 | Landing page, onboarding, import/export |
| **Phase 7 — Quality** | 14 | Tests, performance, and accessibility verified |

---

## Notes for the AI Agent

- Each user story should be implementable as a standalone PR.
- Stories within an epic can often be parallelized across agents.
- Always generate Supabase types after schema changes: `supabase gen types typescript --project-id <id> > types/supabase.ts`.
- Use server components by default; add `'use client'` only when needed for interactivity.
- Prefer server-side data fetching in layouts/pages and pass data down to client components.
- All API routes should validate the session and return 401 for unauthenticated requests.
- The bottle limit (25) should be a configurable constant, not hardcoded throughout the codebase.
- Stripe integration should use the latest `stripe` npm package with TypeScript types.
