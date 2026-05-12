# 🚀 CI/CD Pipeline with Prometheus — Complete Demo Guide

This guide walks you through the **entire CI/CD + Monitoring demo** step-by-step. No prior knowledge needed!

---

## What We're Doing

1. **Push code to GitHub** → GitHub Actions runs a build workflow
2. **Workflow builds the app** → Compiles frontend & backend
3. **Workflow posts a Grafana annotation** → Creates a "deployment marker" in Grafana
4. **You check the dashboard** → See the annotation on Prometheus metrics graph

---

## Part 1: Create GitHub Repository

### Step 1a: Create a new repo on GitHub.com

1. Go to **https://github.com/new**
2. Repository name: `devops-demo` (or any name)
3. Click **Create repository**
4. Copy the repository URL (looks like `https://github.com/YOUR_USERNAME/devops-demo.git`)

### Step 1b: Add remote to your local git

Open PowerShell in `c:\Users\kusha\OneDrive\Desktop\Devops-Demo` and run:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/devops-demo.git
```

**Replace** `YOUR_USERNAME` with your actual GitHub username.

---

## Part 2: Commit & Push Code

In the same PowerShell terminal:

```powershell
# Commit all files
git commit -m "Initial commit: SmartCal app with Prometheus monitoring and CI/CD"

# Push to GitHub (will prompt for GitHub credentials)
git branch -M main
git push -u origin main
```

**What to expect:**
- GitHub login dialog may appear → sign in with your GitHub account
- Files upload to GitHub (~30 seconds)
- Output: "Branch 'main' set up to track remote branch 'main'"

---

## Part 3: Set GitHub Secrets (Required for Grafana Annotation)

The workflow needs two secrets to send annotations to Grafana.

### Step 3a: Get Grafana API Key

1. Open `http://localhost:3001` (Grafana)
2. Login with default credentials: **admin / admin**
3. Go to **Configuration (gear icon) → API Keys**
4. Click **New API key**
   - Name: `CI_CD_ANNOTATION`
   - Role: **Editor**
   - Click **Add**
5. **Copy the key** (it appears once, save it!)

### Step 3b: Add secrets to GitHub

1. Go to your GitHub repo → **Settings → Secrets and variables → Actions**
2. Click **New repository secret** twice:

**Secret 1:**
- Name: `GRAFANA_URL`
- Value: `http://localhost:3001` (or your Grafana URL if deployed)
- Click **Add secret**

**Secret 2:**
- Name: `GRAFANA_API_KEY`
- Value: (paste the API key from Step 3a)
- Click **Add secret**

**Screenshot hint:** After adding, you'll see both secrets listed (value hidden with `●●●`).

---

## Part 4: Trigger the CI/CD Workflow

Now push a code change to trigger the workflow.

### Step 4a: Make a small change

Edit any file (e.g., add a comment to `backend/package.json`):

```powershell
# Open the file in VS Code or edit it
```

Or use PowerShell to add a timestamp to a file:

```powershell
echo "# Updated: $(Get-Date)" >> monitoring/README-Grafana.md
```

### Step 4b: Commit & push

```powershell
git add .
git commit -m "Trigger CI/CD workflow"
git push
```

### Step 4c: Watch the workflow run

1. Go to your GitHub repo
2. Click **Actions** tab
3. Click the workflow named **"CI/CD — Grafana Annotation"**
4. Watch the build steps:
   - ✓ Checkout
   - ✓ Set up Node.js
   - ✓ Install dependencies (frontend)
   - ✓ Install dependencies (backend)
   - ✓ Deploy
   - ✓ **Post Grafana annotation** ← This creates the marker!

**Status:** Green ✓ = success, Red ✗ = failed

---

## Part 5: View the Prometheus + Grafana Dashboard

### Step 5a: Open Grafana

1. Open `http://localhost:3001`
2. Login: **admin / admin**
3. Go to **Dashboards → Browse**
4. Click **"SmartCal — DevOps Monitoring Dashboard"**

### Step 5b: See the annotation

The dashboard shows 8 panels with real-time metrics:

**Top row (4 stat panels):**
- Total API Requests (count)
- Failed Requests (count)
- Avg Response Time (seconds)
- Active Users

**Middle rows (timeseries panels):**
- API Request Rate (RPS per second) — **ANNOTATION appears here as a vertical line**
- Response Latency (p50, p95, p99)

**Bottom rows:**
- Memory Usage (RSS, Heap)
- Business Metrics (Events, Tasks, Registrations)

**Finding the annotation:**
- Look at the **API Request Rate** panel (top-middle timeseries)
- You'll see a vertical line labeled with your deploy message
- Hover over it to see timestamp & message

### Step 5c: Query Prometheus directly (optional)

Go to `http://localhost:9090` (Prometheus) and try these queries in the search box:

```
# Total RPS
sum(rate(smartcal_http_requests_total[1m]))

# Failed RPS
sum(rate(smartcal_http_requests_failed_total[1m]))

# p95 latency
histogram_quantile(0.95, sum(rate(smartcal_http_response_time_seconds_bucket[5m])) by (le))
```

Click **Execute** and then **Graph** tab to see real-time data.

---

## Part 6: Demo Script (What to Show)

When presenting, follow this flow:

1. **Show GitHub repo:**
   - "Here's the code on GitHub with CI/CD workflow defined"
   - Click **Actions → CI/CD — Grafana Annotation** to show the workflow

2. **Trigger the build:**
   - "Let's push a change and watch the pipeline"
   - Make a commit & push
   - Watch the workflow steps in real-time

3. **Show the dashboard:**
   - "The workflow automatically posts a Grafana annotation"
   - Open Grafana dashboard
   - Show the vertical line (annotation) on the timeseries panel
   - "This marker shows when the deployment happened"

4. **Explain the metrics:**
   - Point to each panel and explain:
     - Total Requests: API volume
     - Failed Requests: Errors
     - Response Time: Latency
     - Request Rate graph: Shows spikes over time + **deployment markers**

5. **Optional: Query Prometheus:**
   - Open Prometheus (http://localhost:9090)
   - Run a PromQL query to show raw data
   - Explain the query language

---

## Troubleshooting

### Workflow fails with "Grafana annotation" error

**Cause:** Secrets not set correctly.

**Fix:**
- Go to GitHub repo **Settings → Secrets**
- Verify `GRAFANA_URL` and `GRAFANA_API_KEY` exist (not empty)
- Re-run the workflow: go to **Actions → click workflow → Re-run jobs**

### Annotation doesn't appear on dashboard

**Cause:** Time range doesn't include the annotation time.

**Fix:**
- On Grafana dashboard, click the time picker (top-right, e.g., "Last 6 hours")
- Change to **Last 1 hour** or **Last 30 minutes**
- Refresh the page (F5)

### Backend not exposing metrics

**Cause:** Backend not running.

**Fix:**
```powershell
cd c:\Users\kusha\OneDrive\Desktop\Devops-Demo\backend
npm start
```

Check `http://localhost:5000/metrics` returns JSON.

### Grafana not running

**Cause:** Grafana not started.

**Fix:**
```powershell
# Start Grafana service
Start-Service grafana

# Or run directly
& "C:\Program Files\GrafanaLabs\grafana\bin\grafana-server.exe"
```

Check `http://localhost:3001` responds.

---

## Key Files in This Demo

| File | Purpose |
|------|---------|
| `.github/workflows/grafana-annotation.yml` | GitHub Actions workflow (build + annotate) |
| `monitoring/grafana/dashboards/smartcal-dashboard.json` | Pre-built Grafana dashboard (8 panels) |
| `monitoring/prometheus.yml` | Prometheus scrape config |
| `backend/src/server.js` | Backend with Prometheus metrics (`/metrics` endpoint) |
| `monitoring/README-Grafana.md` | Grafana import & PromQL queries |

---

## What the Workflow Does (Behind the Scenes)

When you push to GitHub:

```
┌─────────────────────────────────────────────┐
│ GitHub Push (main branch)                   │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ GitHub Actions Triggered                    │
│ (.github/workflows/grafana-annotation.yml)  │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 1. npm install & build (frontend)           │
│ 2. npm install & build (backend)            │
│ 3. (Optional) Deploy                        │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 4. POST /api/annotations to Grafana         │
│    • Time: current timestamp                │
│    • Message: "Deployment notification"     │
│    • Tags: ["ci", "deploy"]                 │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ Grafana displays annotation on dashboard    │
│ (visible as vertical line on timeseries)    │
└─────────────────────────────────────────────┘
```

---

## Quick Reference: Commands

```powershell
# Initialize git (already done)
git init

# Set up remote
git remote add origin https://github.com/YOUR_USERNAME/devops-demo.git

# Commit & push
git add .
git commit -m "Your message"
git push

# Make a change & push again (triggers workflow)
echo "# Change" >> backend/package.json
git add .
git commit -m "Trigger workflow"
git push
```

---

## Next Steps After Demo

1. **Deploy to Azure:** Use `docker-compose` or Azure App Service
2. **Real monitoring:** Set up production Prometheus scrape targets
3. **Alerting:** Add Grafana alert rules (e.g., error rate > 5%)
4. **Custom metrics:** Add business-specific counters to the app

---

**Ready? Start with Part 1 (Create GitHub Repository) and follow each step in order!**
