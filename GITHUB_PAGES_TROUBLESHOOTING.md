# GitHub Pages Deployment Fix

## Issue
The application shows a blank page when deployed to GitHub Pages.

## Root Causes & Solutions

### 1. Base Path Configuration
**Fixed**: Updated `vite.config.ts` to use `base: './'` for relative paths instead of absolute paths.

### 2. Asset Loading
**Fixed**: Added proper build configuration with explicit asset naming:
- `entryFileNames: 'assets/[name].[hash].js'`
- `chunkFileNames: 'assets/[name].[hash].js'`
- `assetFileNames: 'assets/[name].[hash].[ext]'`

### 3. Jekyll Processing
**Fixed**: Added `.nojekyll` file in the `public/` directory to prevent GitHub Pages from processing files through Jekyll, which can break JavaScript files with underscores.

### 4. Error Tracking
**Fixed**: Added global error handlers in `index.html` to catch and log any runtime errors.

### 5. Build Settings
**Fixed**: Updated build configuration:
- `minify: 'esbuild'`
- `target: 'es2020'`
- `sourcemap: false`

## Deployment Steps

### Method 1: GitHub Actions (Recommended)
1. Go to your GitHub repository settings
2. Navigate to Pages section
3. Under "Build and deployment", select "GitHub Actions" as the source
4. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ['main']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          GITHUB_ACTIONS: true
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Method 2: Manual Build and Deploy
1. Build the project locally:
   ```bash
   npm run build
   ```

2. Go to your GitHub repository settings
3. Navigate to Pages section
4. Under "Build and deployment", select "Deploy from a branch"
5. Select the branch containing your `dist` folder
6. Select `/dist` (or `/docs` if you configure it) as the folder
7. Save

### Method 3: Using gh-pages npm package
1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add deploy script to `package.json`:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. Run:
   ```bash
   npm run deploy
   ```

## Verification Checklist

After deployment, check:
1. ✅ Page loads without blank screen
2. ✅ No console errors in browser DevTools
3. ✅ All CSS styles are applied
4. ✅ Interactive elements work (buttons, forms, etc.)
5. ✅ Images and assets load correctly
6. ✅ Navigation between tabs works
7. ✅ Map displays correctly

## Debugging Tips

### If you still see a blank page:

1. **Check Browser Console**
   - Open DevTools (F12)
   - Look for red errors in Console tab
   - Look for failed network requests in Network tab

2. **Check File Paths**
   - All paths should be relative (no leading `/`)
   - Assets should load from `./assets/` directory

3. **Check GitHub Pages Settings**
   - Verify the correct branch is selected
   - Verify the correct folder is selected (`/dist` or `/root`)
   - Check that GitHub Pages is enabled

4. **Check Build Output**
   - Verify `dist/index.html` exists
   - Verify `dist/assets/` contains JS and CSS files
   - Check that `.nojekyll` file is present in dist

5. **Check for Mixed Content**
   - If your site is served over HTTPS, all resources must be HTTPS
   - Check that external resources (fonts, maps) use HTTPS URLs

6. **Try Local Preview**
   ```bash
   npm run build
   npm run preview
   ```
   If it works locally but not on GitHub Pages, it's likely a path issue.

## Common Errors and Fixes

### Error: "Uncaught SyntaxError: Unexpected token '<'"
**Cause**: JavaScript file returning HTML (404 page)
**Fix**: Check that `base` in `vite.config.ts` is set to `'./'`

### Error: "Failed to load module script"
**Cause**: Incorrect module paths
**Fix**: Ensure all imports use relative paths and `@/` alias is configured

### Error: Map not displaying
**Cause**: Leaflet CSS not loading or CORS issue
**Fix**: Verify Leaflet CSS link in `index.html` uses HTTPS and has `crossorigin` attribute

### Error: Fonts not loading
**Cause**: Google Fonts blocked or incorrect URL
**Fix**: Check that Google Fonts link in `index.html` includes `crossorigin` attribute

## Files Modified

1. `vite.config.ts` - Updated build configuration for GitHub Pages
2. `index.html` - Added error tracking scripts
3. `public/.nojekyll` - Added to prevent Jekyll processing
4. `src/App.tsx` - Added initialization logging

## Next Steps

If the blank page persists after these fixes:
1. Check the browser console for specific error messages
2. Verify your repository settings in GitHub Pages
3. Try clearing your browser cache
4. Check that all environment variables are properly configured

## Testing Locally

Before deploying, always test the production build locally:

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

Visit `http://localhost:4173` to see how it will look on GitHub Pages.
