# 🚀 Deployment Guide - Optimistic Oracle

Complete step-by-step guide to push to GitHub and deploy to production.

---

## 📋 **Prerequisites Checklist**

- [ ] GitHub account
- [ ] Vercel account (free tier works)
- [ ] Domain: optimisticoracle.com configured
- [ ] Git installed locally
- [ ] All code changes saved

---

## 🔧 **Step 1: Prepare Repository**

### 1.1 Copy Environment Files

```bash
cd ~/optimistic_oracle

# Landing
cp /path/to/.env.example.landing packages/landing/.env.example

# Dashboard  
cp /path/to/.env.example.dashboard packages/dashboard/.env.example

# API
cp /path/to/.env.example.api packages/api/.env.example
```

### 1.2 Copy Config Files

```bash
# Root directory
cp /path/to/.gitignore .gitignore
cp /path/to/vercel.json vercel.json
cp /path/to/README.md README.md
```

---

## 📦 **Step 2: Initialize Git & Push to GitHub**

### 2.1 Initialize Git Repository

```bash
cd ~/optimistic_oracle

# Initialize git (if not already)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Optimistic Oracle v0.1.0"
```

### 2.2 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `optimistic-oracle`
3. Description: `Optimistic Oracle - Truth by Default, Verified by Economics`
4. **Keep it Public** (for open source)
5. **DO NOT** initialize with README (we already have one)
6. Click "Create repository"

### 2.3 Push to GitHub

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/optimistic-oracle.git

# Push to main branch
git branch -M main
git push -u origin main
```

### 2.4 Verify on GitHub

Visit: `https://github.com/YOUR_USERNAME/optimistic-oracle`

You should see all your files!

---

## 🌐 **Step 3: Deploy Landing Page to Vercel**

### 3.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Login to Vercel

```bash
vercel login
```

### 3.3 Link Project

```bash
cd ~/optimistic_oracle
vercel
```

Answer the prompts:
- Set up and deploy? **Y**
- Which scope? **Your account**
- Link to existing project? **N**
- What's your project's name? **optimistic-oracle**
- In which directory is your code located? **./packages/landing**
- Want to override the settings? **N**

### 3.4 Set Environment Variables in Vercel

**Option A: Via CLI**
```bash
vercel env add VITE_DASHBOARD_URL
# Enter: https://dashboard.optimisticoracle.com

vercel env add VITE_DOCS_URL
# Enter: https://docs.optimisticoracle.com

vercel env add VITE_GITHUB_URL
# Enter: https://github.com/YOUR_USERNAME/optimistic-oracle

vercel env add VITE_API_URL
# Enter: https://api.optimisticoracle.com
```

**Option B: Via Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable (Production, Preview, Development)

### 3.5 Deploy to Production

```bash
vercel --prod
```

Your landing page is now live! 🎉

---

## 🎯 **Step 4: Configure Custom Domain**

### 4.1 Add Domain in Vercel

1. Go to Vercel Dashboard → Your Project
2. Click "Settings" → "Domains"
3. Add domain: `optimisticoracle.com`
4. Add domain: `www.optimisticoracle.com`

### 4.2 Update DNS Records

Add these records in your domain registrar (e.g., Namecheap, GoDaddy):

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

**Wait 24-48 hours for DNS propagation.**

---

## 📊 **Step 5: Deploy Dashboard (Separate Project)**

### 5.1 Create New Vercel Project for Dashboard

```bash
cd ~/optimistic_oracle/packages/dashboard
vercel
```

Answer:
- Set up and deploy? **Y**
- Link to existing project? **N**
- Project name? **optimistic-oracle-dashboard**
- Directory? **.** (current directory)

### 5.2 Add Environment Variables

```bash
vercel env add VITE_API_URL
# Enter: https://api.optimisticoracle.com
```

### 5.3 Deploy

```bash
vercel --prod
```

### 5.4 Add Custom Domain

1. Vercel Dashboard → optimistic-oracle-dashboard
2. Settings → Domains
3. Add: `dashboard.optimisticoracle.com`

Add DNS record:
```
Type    Name        Value
CNAME   dashboard   cname.vercel-dns.com
```

---

## 🔌 **Step 6: Deploy API**

The API needs a different hosting service (Vercel doesn't support long-running Node processes well).

### Option A: Railway (Recommended)

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `optimistic-oracle` repo
5. Root directory: `/packages/api`
6. Add environment variables:
   ```
   PORT=3000
   NODE_ENV=production
   BASE_URL=https://api.optimisticoracle.com
   CORS_ORIGIN=https://optimisticoracle.com,https://dashboard.optimisticoracle.com
   ```
7. Deploy!
8. Copy the Railway URL
9. Add custom domain: `api.optimisticoracle.com`

### Option B: Render

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - Name: `optimistic-oracle-api`
   - Root Directory: `packages/api`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Add environment variables
6. Deploy
7. Add custom domain

---

## ✅ **Step 7: Verify Everything Works**

### 7.1 Check All URLs

```bash
# Landing
curl https://optimisticoracle.com

# Dashboard
curl https://dashboard.optimisticoracle.com

# API Health
curl https://api.optimisticoracle.com/api/health
```

### 7.2 Test Full Flow

1. Visit https://optimisticoracle.com
2. Click "Dashboard" button
3. Should navigate to dashboard
4. Dashboard should load data from API
5. Create a test request
6. Verify it appears in the list

---

## 🔄 **Step 8: Future Updates**

### Update Code

```bash
# Make changes
git add .
git commit -m "Update: description of changes"
git push origin main
```

### Redeploy

Vercel will **auto-deploy** on every push to main! 🚀

For manual deployment:
```bash
vercel --prod
```

---

## 🐛 **Troubleshooting**

### Issue: "Module not found"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Environment variable not working"
- Check spelling in Vercel dashboard
- Restart deployment after adding variables
- Variables must start with `VITE_` for Vite projects

### Issue: "API CORS error"
- Update `CORS_ORIGIN` in API environment variables
- Include all domains (landing, dashboard)

### Issue: "Domain not resolving"
- Wait 24-48 hours for DNS propagation
- Use https://dnschecker.org to verify
- Clear browser cache

---

## 📞 **Need Help?**

- GitHub Issues: https://github.com/YOUR_USERNAME/optimistic-oracle/issues
- Vercel Support: https://vercel.com/support
- Railway Support: https://railway.app/help

---

## 🎉 **Congratulations!**

Your Optimistic Oracle is now live in production! 🚀

**Next Steps:**
- Share on Twitter/X
- Submit to Solana ecosystem directory
- Write launch blog post
- Gather user feedback

---

**Built with ⚡ on Solana**
