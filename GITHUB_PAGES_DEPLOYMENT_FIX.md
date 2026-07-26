# GitHub Pages Deployment Fix

## Issue
Blank screen when deploying to GitHub Pages.

## Root Cause Analysis
The blank screen on GitHub Pages is typically caused by:
1. **Base path configuration** - Vite needs correct base path for GitHub Pages
2. **Asset loading** - CSS/JS files not loading due to incorrect paths
3. **Build configuration** - Missing or incorrect build settings
4. **Runtime errors** - JavaScript errors preventing app initialization
5. **Spark runtime** - The @github/spark runtime may not be loading in production

## Solutions Implemented

### 1. Updated Vite Configuration (`vite.config.ts`)
```typescript
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? './' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  },
  // ... rest of config
});
```

### 2. Enhanced Error Handling (`ErrorFallback.tsx`)
- Added console logging for production errors
- Added stack trace display for debugging
- Used hardcoded colors to ensure visibility even if CSS fails

### 3. Created Debug Page (`public/debug.html`)
- Visit `/debug.html` on your GitHub Pages site to see:
  - Current URL and browser info
  - Feature support (Geolocation, LocalStorage, etc.)
  - Any JavaScript errors that occur

### 4. Testing Instructions

#### Local Build Test
```bash
# Build the project locally
npm run build

# Preview the built version (should match GitHub Pages)
npm run preview
```

Then open http://localhost:4173 and verify everything works.

#### Debug on GitHub Pages
After deployment, visit these URLs:
1. `https://[username].github.io/[repo-name]/` - Main app
2. `https://[username].github.io/[repo-name]/debug.html` - Debug info

#### After Pushing to GitHub
1. Go to your repository → Actions tab
2. Watch the workflow run and verify:
   - ✅ Build step completes successfully
   - ✅ No error messages in build logs
   - ✅ Artifact is uploaded
   - ✅ Deploy step succeeds
3. Visit your GitHub Pages URL
4. Open browser console (F12) and look for:
   - Red error messages
   - Failed network requests (404s)
   - CORS errors

### 5. Common Issues and Fixes

**Issue: Completely blank screen, no error in console**
- The JavaScript isn't loading at all
- Check Network tab in DevTools for 404 errors
- Verify `base` path matches your repository structure
- Try visiting `/debug.html` to see if any HTML loads

**Issue: Error about "spark is not defined"**
- The Spark runtime isn't loading
- This is expected on GitHub Pages - Spark apps need the Spark runtime
- **Spark apps are designed to run in the Spark environment, not standalone**

**Issue: 404 on assets (CSS/JS files)**
- Check the base path in `vite.config.ts`
- Verify the repository name in your GitHub Pages URL
- Make sure `.nojekyll` file exists in public folder
- Check dist folder structure after build

**Issue: App loads but features don't work**
- Geolocation requires HTTPS (GitHub Pages provides this)
- Check browser console for permission errors
- Verify all dependencies are in package.json

**Issue: Build fails in GitHub Actions**
- Check the Actions log for specific error messages
- Verify `package-lock.json` is committed
- Ensure all imports are correct (no missing files)

### 6. Important Note About Spark Apps

⚠️ **Spark apps require the Spark runtime to function properly.** This app uses:
- `@github/spark` - Core runtime and hooks
- `window.spark` - Global Spark API for KV storage and user info

If deploying outside of the Spark environment (like vanilla GitHub Pages), these features won't work. The app is designed to run within the Spark platform.

### 7. GitHub Pages Settings

Make sure in your repository settings:
1. Go to Settings → Pages
2. **Source: GitHub Actions** (not "Deploy from a branch")
3. The workflow file is in `.github/workflows/`
4. The workflow has proper permissions (already configured)

### 8. Debugging Checklist

- [ ] Build completes locally without errors (`npm run build`)
- [ ] Preview works locally (`npm run preview`)
- [ ] GitHub Actions workflow completes successfully
- [ ] Can access debug page at `/debug.html`
- [ ] Browser console shows specific error (if any)
- [ ] Network tab shows which files are failing to load (if any)
- [ ] Repository Settings → Pages shows "Your site is live at..."

## Files Modified
- `vite.config.ts` - Updated build configuration with conditional base path
- `ErrorFallback.tsx` - Enhanced error display with stack traces
- `public/debug.html` - NEW debug diagnostic page

## Next Steps
1. ✅ Commit these changes
2. ✅ Push to main branch
3. ⏳ Wait for GitHub Actions to complete (1-2 minutes)
4. 🌐 Visit your GitHub Pages URL
5. 🔍 If still blank:
   - Visit `/debug.html` for diagnostics
   - Check browser console for errors
   - Review GitHub Actions logs for build errors
   - Verify GitHub Pages settings use "GitHub Actions" as source

## Understanding the Limitation

This Spark app relies on the Spark runtime environment. When deployed to vanilla GitHub Pages, the `@github/spark` runtime and `window.spark` global will not be available, which may cause runtime errors. The app is designed to run within the GitHub Spark platform, not as a standalone GitHub Pages site.
