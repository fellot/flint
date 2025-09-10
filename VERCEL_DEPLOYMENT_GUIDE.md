# Vercel Deployment Guide

## Issues Fixed

### 1. Next.js Configuration Issue ✅
**Problem**: The `next.config.js` had an incorrect rewrite rule that was breaking API routes.
**Solution**: Removed the unnecessary rewrite rule since Next.js 13+ App Router handles API routes automatically.

### 2. File System Access Issue ✅
**Problem**: Vercel's serverless functions have a read-only file system, so `fs.writeFile()` doesn't work.
**Solution**: Created a storage abstraction layer (`lib/storage.ts`) that:
- Uses file system in local development
- Uses in-memory storage in Vercel (temporary solution)

### 3. API Route Updates ✅
**Problem**: API routes were directly using file system operations.
**Solution**: Updated all API routes to use the storage abstraction layer.

## Current Status

✅ **Fixed**: Edit wine functionality should now work on Vercel
⚠️ **Temporary**: Data is stored in memory (resets on each deployment)

## Next Steps for Production

### Option 1: Database Integration (Recommended)
For a production app, you should integrate with a database:

1. **Vercel Postgres** (Recommended)
   ```bash
   npm install @vercel/postgres
   ```

2. **PlanetScale** (MySQL)
   ```bash
   npm install @planetscale/database
   ```

3. **Supabase** (PostgreSQL)
   ```bash
   npm install @supabase/supabase-js
   ```

### Option 2: External Storage
- **Vercel KV** (Redis)
- **Upstash Redis**
- **AWS S3** with JSON files

### Option 3: Git-based Storage (Current Approach)
- Use GitHub API to read/write JSON files
- Requires GitHub token configuration
- More complex but maintains version control

## Environment Variables for Vercel

If you choose the Git-based approach, configure these in Vercel:

```
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo-name
GITHUB_BRANCH=main
GITHUB_TOKEN=your-github-token
```

## Testing the Fix

1. Deploy to Vercel
2. Test wine editing functionality
3. Verify data persists (currently in memory)

## Database Migration Example

Here's how to migrate to Vercel Postgres:

```typescript
// lib/database.ts
import { sql } from '@vercel/postgres';

export async function loadWines(dataSource: string = '1'): Promise<Wine[]> {
  const result = await sql`SELECT * FROM wines WHERE data_source = ${dataSource}`;
  return result.rows;
}

export async function saveWines(wines: Wine[], dataSource: string = '1'): Promise<void> {
  // Implementation for database storage
}
```

## Current Limitations

- Data resets on each Vercel deployment
- No data persistence between function invocations
- Not suitable for production use

## Immediate Action Required

1. Deploy the current fixes to Vercel
2. Test the edit functionality
3. Choose a database solution for production
4. Implement the chosen database solution
