# 📋 Quick Reference - Optimistic Oracle

Common commands you'll use frequently.

---

## 🚀 **Git Commands**

```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your message here"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# Create new branch
git checkout -b feature/new-feature

# Switch branch
git checkout main

# View commit history
git log --oneline
```

---

## 📦 **NPM Commands**

```bash
# Install dependencies (root)
npm install

# Install in specific package
cd packages/landing && npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Clean node_modules
rm -rf node_modules && npm install
```

---

## ⚓ **Anchor Commands**

```bash
# Build program
anchor build

# Test program
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet

# Get program ID
anchor keys list

# Clean build artifacts
anchor clean
```

---

## 🌐 **Vercel Commands**

```bash
# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod

# Add environment variable
vercel env add VARIABLE_NAME

# Pull environment variables
vercel env pull

# List projects
vercel projects list

# Remove project
vercel remove
```

---

## 🔍 **Debugging Commands**

```bash
# Check API is running
curl http://localhost:3000/api/health

# Check Solana connection
solana config get

# Get wallet balance
solana balance

# View logs (API)
cd packages/api && npm run dev

# View network requests (browser)
# Open DevTools → Network tab

# Check Vercel deployment logs
vercel logs
```

---

## 📊 **Project Structure Commands**

```bash
# View project structure
tree -L 3 -I 'node_modules|dist|target'

# Count lines of code
find . -name '*.ts' -o -name '*.tsx' -o -name '*.rs' | xargs wc -l

# Find specific file
find . -name "App.tsx"

# Search for text in files
grep -r "localhost" --include="*.tsx"
```

---

## 🔧 **Environment Setup**

```bash
# Copy env files
cp .env.example .env

# Edit env file
nano .env

# View env file
cat .env

# Remove env file (be careful!)
rm .env
```

---

## 🧹 **Cleanup Commands**

```bash
# Clean all node_modules
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Clean all dist folders
find . -name "dist" -type d -prune -exec rm -rf '{}' +

# Clean Anchor artifacts
anchor clean

# Clean everything and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📱 **Local Development URLs**

```
Landing:    http://localhost:5174
Dashboard:  http://localhost:5173
API:        http://localhost:3000
API Health: http://localhost:3000/api/health
API Stats:  http://localhost:3000/api/stats
```

---

## 🌍 **Production URLs**

```
Landing:    https://optimisticoracle.com
Dashboard:  https://dashboard.optimisticoracle.com
API:        https://api.optimisticoracle.com
Docs:       https://docs.optimisticoracle.com
GitHub:     https://github.com/YOUR_USERNAME/optimistic-oracle
```

---

## 🔑 **Important File Locations**

```
Smart Contract:    programs/optimistic_oracle/src/lib.rs
Landing App:       packages/landing/src/App.tsx
Dashboard App:     packages/dashboard/src/App.tsx
API Server:        packages/api/src/index.ts
SDK:               packages/sdk/src/index.ts
Deployment Config: Anchor.toml
Vercel Config:     vercel.json
```

---

## 🆘 **Emergency Commands**

```bash
# Kill port 3000 (if API won't start)
lsof -ti:3000 | xargs kill -9

# Kill port 5173 (if dashboard won't start)
lsof -ti:5173 | xargs kill -9

# Reset git (if stuck)
git reset --hard HEAD

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Force pull (discard local changes)
git fetch origin
git reset --hard origin/main
```

---

## 📞 **Get Help**

```bash
# NPM help
npm help

# Git help
git --help

# Anchor help
anchor --help

# Vercel help
vercel --help
```

---

**💡 Tip:** Bookmark this file for quick reference!
