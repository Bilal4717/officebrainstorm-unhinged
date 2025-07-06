# Export Instructions for GitHub

## Files to Upload to GitHub

### Core Application Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Build configuration
- `tailwind.config.ts` - Styling configuration
- `postcss.config.js` - CSS processing
- `drizzle.config.ts` - Database configuration
- `components.json` - UI components configuration

### Source Code Directories
- `client/` - Frontend React application
- `server/` - Backend Express application
- `shared/` - Shared types and schemas
- `public/` - Static assets

### Important Files
- `.gitignore` - Git ignore rules
- `README.md` - Project documentation (create this)

## Files to NOT Upload (already in .gitignore)
- `node_modules/` - Dependencies (will be installed)
- `dist/` - Built files (will be generated)
- `.replit` - Replit configuration
- `.env` files - Environment variables
- `.cache/`, `.config/`, `.local/` - Replit specific

## GitHub Repository Setup
1. Create new repository on GitHub
2. Upload all files except those in .gitignore
3. Add environment variables in deployment settings

## Deployment Environment Variables
```
NODE_ENV=production
VULTR_API_KEY=your_key_here
BASIC_AUTH_USERNAME=your_username
BASIC_AUTH_PASSWORD=your_password
```