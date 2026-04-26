# Teen Minar - Setup Guide 🚀

Complete guide to deploy Teen Minar website on Cloudflare Pages with automatic data sync from Google Sheet.

---

## Step 1: Make Google Sheet Public

Your sheet must be publicly readable for the automation to work.

1. Open your Google Sheet: `NewProjectResult`
2. Click **File** → **Share** → **Share with others**
3. Under "General access", change from "Restricted" to **"Anyone with the link"**
4. Set role to **"Viewer"** (not Editor!)
5. Click **Done**

> ⚠ **Important:** The sheet must stay public. Only "Viewer" access is needed — nobody can edit it.

---

## Step 2: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `teenminar` (or any name)
3. Keep it **Public** (Cloudflare Pages needs access)
4. **Don't** initialize with README (we'll push existing code)
5. Click **Create repository**

### Push the code:

Open terminal/command prompt in the project folder and run:

```bash
git init
git add .
git commit -m "Initial commit - Teen Minar website"
git branch -M main
git remote add origin https://github.com/mdmehboobhusaini-ui/teenminar.git
git push -u origin main
```

---

## Step 3: Add Sheet ID as GitHub Secret

1. Go to your repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `SHEET_ID`
4. Value: `1Y1BJ-5mAGWhV_-cpCz6fo-JYO9mQBMxmBAGAhXM3Tec`
   *(This is your Google Sheet ID from the URL)*
5. Click **Add secret**

---

## Step 4: Enable GitHub Actions

1. Go to your repo → **Actions** tab
2. Click **I understand my workflows, go ahead and enable them**
3. The workflow "Update Result Data" will now run:
   - **Automatically** every day at 10:30 PM IST (5:00 PM UTC)
   - **Manually** — click the workflow → **Run workflow** → **Run workflow**

### Test it now:
1. Go to **Actions** → **Update Result Data** → **Run workflow** → **Run workflow**
2. Wait ~1 minute for it to complete
3. Check the `data/` folder — JSON files should be updated with real sheet data

---

## Step 5: Connect Cloudflare Pages

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Sign in (or create free account)
3. Go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
4. Select your **GitHub account** and the **teenminar** repository
5. Configure:
   - **Production branch:** `main`
   - **Build command:** *(leave empty)*
   - **Build output directory:** *(leave empty or put `/`)*
6. Click **Save and Deploy**
7. Your site will be live at: `https://teenminar.pages.dev`

---

## Step 6: Add Custom Domain (Optional)

### For teenminar.com:
1. In Cloudflare Pages project → **Custom domains** → **Set up a custom domain**
2. Enter `teenminar.com` → **Continue**
3. If domain is on Cloudflare:
   - DNS record is auto-created
4. If domain is elsewhere:
   - Add a CNAME record: `teenminar.com` → `teenminar.pages.dev`

### For teenminar.in:
- Repeat the same process with `teenminar.in`

---

## How It Works (Automation)

```
You update Google Sheet → GitHub Actions runs at 10:30 PM IST
→ Python script fetches sheet data → Converts to JSON
→ Commits to GitHub → Cloudflare auto-deploys → Website updated!
```

**You only need to:**
1. Update the Google Sheet daily with new results
2. When a new year starts, create a new tab named with the year (e.g., "2027")

**That's it!** Everything else is fully automatic.

---

## When New Year Starts

1. Open your Google Sheet
2. Click **+** (add new sheet tab) at the bottom
3. Name it with the year number: `2027`
4. Add headers in Row 1: `date` in A1, `result` in B1
5. Start entering data from Row 2

The script automatically detects all year tabs from 2018 onwards. No code changes needed!

---

## Sheet Data Format

| Column A (date) | Column B (result) |
|---|---|
| 1-Jan-2027 | 4, 8, 19, 26, 32, 46, 47 |
| 2-Jan-2027 | 2, 9, 15, 23, 38, 41, 50 |

- **Date formats supported:** `1-Jan-2027`, `1 Jan 2027`, `2027-01-01`
- **Numbers:** Comma-separated
- **First row** should be headers (`date`, `result`)

---

## Manual Data Sync

If you want to sync data immediately (without waiting for the cron):

### Option A: GitHub Actions (recommended)
1. Go to **Actions** → **Update Result Data** → **Run workflow**

### Option B: Run locally
```bash
# Set your sheet ID
set SHEET_ID=1Y1BJ-5mAGWhV_-cpCz6fo-JYO9mQBMxmBAGAhXM3Tec

# Run the script
python scripts/fetch_data.py

# Commit and push
git add data/
git commit -m "Update results"
git push
```

---

## Traffic Limits (All Free!)

| Service | Free Limit | Our Usage |
|---|---|---|
| **Cloudflare Pages** | Unlimited bandwidth | ✅ Handles 1M+ easily |
| **GitHub Actions** | 2,000 min/month | ✅ Uses ~15 min/month |
| **GitHub Storage** | 1 GB (repo) | ✅ JSON files ~2 MB total |
| **Google Sheet** | No read limit (public) | ✅ Accessed once/day by script |

**Result: 1 million+ visitors = ₹0 cost** 🎉

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Data not updating | Check GitHub Actions tab for errors |
| 401 error in script | Make Google Sheet public (Step 1) |
| Site not deploying | Check Cloudflare Pages dashboard |
| New year not showing | Create the sheet tab and run workflow manually |
| Wrong numbers | Check sheet data format (comma-separated) |
