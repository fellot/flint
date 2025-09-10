# Environment Setup Guide

## Required Environment Variables

Your app now uses GitHub API for data persistence. You need to configure these environment variables:

### For Vercel Deployment

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following variables:

```
GITHUB_OWNER=your-github-username
GITHUB_REPO=your-repository-name
GITHUB_BRANCH=main
GITHUB_TOKEN=your-github-personal-access-token
```

### For Local Development

Create a `.env.local` file in your project root:

```bash
# .env.local
GITHUB_OWNER=your-github-username
GITHUB_REPO=your-repository-name
GITHUB_BRANCH=main
GITHUB_TOKEN=your-github-personal-access-token
```

## GitHub Token Setup

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Wine App API Access"
4. Select these scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
5. Click "Generate token"
6. Copy the token and use it as `GITHUB_TOKEN`

## Repository Structure

Make sure your GitHub repository has the data files in the correct location:

```
your-repo/
├── data/
│   ├── wines.json
│   └── wines2.json
├── app/
├── components/
└── ...
```

## Testing the Setup

1. **Local Testing:**
   ```bash
   npm run dev
   ```
   - Open http://localhost:3000
   - Try adding/editing a wine
   - Check your GitHub repository for commits

2. **Vercel Testing:**
   - Deploy to Vercel
   - Test the wine editing functionality
   - Verify commits appear in your GitHub repository

## Fallback Behavior

If GitHub credentials are not configured or API calls fail, the app will:
- **Local development**: Fall back to local file system
- **Vercel**: Show error messages (no fallback available)

## Troubleshooting

### Common Issues:

1. **"GitHub credentials not configured"**
   - Check that all environment variables are set
   - Verify the token has the correct permissions

2. **"Failed to save wines: Bad credentials"**
   - Check your GitHub token is valid
   - Ensure the token hasn't expired

3. **"Repository not found"**
   - Verify `GITHUB_OWNER` and `GITHUB_REPO` are correct
   - Check the repository exists and is accessible

4. **"File not found"**
   - Ensure `data/wines.json` exists in your repository
   - Check the file path is correct

### Debug Mode:

Add this to your `.env.local` for detailed logging:
```
NODE_ENV=development
```

## Security Notes

- Never commit your `.env.local` file
- Use environment variables for all sensitive data
- Regularly rotate your GitHub tokens
- Use repository-specific tokens when possible
