# GitHub Pages Deployment Guide

## What Was Fixed

The blank page issue was caused by an incorrect `base` path in the Vite configuration. Since your repository is hosted at `https://github.com/craig2517/bayou`, GitHub Pages serves it from `https://craig2517.github.io/bayou/` (not the root).

### Changes Made:

1. **Updated `vite.config.ts`**: Changed `base: '/'` to `base: '/bayou/'`
2. **Created `.nojekyll` file**: Ensures GitHub Pages doesn't ignore Vite's asset files

## How to Deploy

### Step 1: Build Your Project

Run this command in your terminal:

```bash
npm run build
```

This will create a `dist` folder with your production-ready files.

### Step 2: Commit and Push to GitHub

```bash
git add .
git commit -m "Fix GitHub Pages deployment with correct base path"
git push origin main
```

### Step 3: Configure GitHub Pages Settings

1. Go to your repository on GitHub: `https://github.com/craig2517/bayou`
2. Click **Settings** (top navigation)
3. Click **Pages** (left sidebar)
4. Under **Source**, select:
   - Branch: `main`
   - Folder: `/` (root) or `/dist` depending on your setup
5. Click **Save**

### Step 4: Wait for Deployment

GitHub will automatically deploy your site. This usually takes 1-2 minutes. You'll see a green checkmark when it's ready.

### Step 5: Access Your Site

Your site will be available at: **https://craig2517.github.io/bayou/**

## Troubleshooting

### Still seeing a blank page?

1. **Check Browser Console**: 
   - Right-click → Inspect → Console tab
   - Look for 404 errors or asset loading issues

2. **Hard Refresh**:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

3. **Verify Build Output**:
   ```bash
   npm run build
   ```
   Check that `dist/index.html` exists and references assets correctly

4. **Check GitHub Actions**:
   - Go to the **Actions** tab in your repository
   - Make sure the deployment workflow completed successfully

### Assets not loading?

If you see 404 errors for JS/CSS files:
- Verify the `base: '/bayou/'` is still in `vite.config.ts`
- Rebuild: `npm run build`
- Push changes and wait for redeployment

## Alternative Deployment Option: GitHub Actions

For automatic deployments on every push, you can use GitHub Actions. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
      
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

With this workflow, your site will automatically rebuild and deploy every time you push to the `main` branch.

## Testing Locally

To test the production build locally before deploying:

```bash
npm run build
npm run preview
```

This will serve your built site at `http://localhost:4173` (or similar).

## Important Notes

- **Base Path**: The `/bayou/` base path is critical. If you ever rename your repository, you'll need to update this.
- **Custom Domain**: If you add a custom domain later, change `base: '/bayou/'` back to `base: '/'`
- **Environment**: Spark features like `spark.kv`, `spark.user()`, etc. only work in the Spark environment, not on GitHub Pages

## Success Indicators

✅ No errors in browser console
✅ All assets load correctly (check Network tab)
✅ Application renders and is interactive
✅ URL is `https://craig2517.github.io/bayou/`

## Quick Reference

- **Repository**: https://github.com/craig2517/bayou
- **Live Site**: https://craig2517.github.io/bayou/
- **Build Command**: `npm run build`
- **Build Output**: `dist/` folder
- **Base Path**: `/bayou/`
