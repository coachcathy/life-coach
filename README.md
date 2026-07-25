# Life Coach — Phase 10

## What changed

- Renamed the app from **SLY Command Center** to **Life Coach**.
- Added an **Immediate Cash Balance** card to Finance.
- Finance cash includes **checking and savings accounts only**.
- Trading accounts, investments, crypto holdings, and real-estate equity are excluded.
- You can add, edit, and remove cash accounts and update their current balances.
- The dashboard automatically totals checking, savings, and combined immediate cash.

## Local test

Open `index.html` directly, or run a local server from this folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy to GitHub Pages

From inside this folder:

```bash
git add .
git commit -m "Add Life Coach immediate cash balance"
git push origin main
```

If this is a new repository:

```bash
git init
git add .
git commit -m "Launch Life Coach"
git branch -M main
git remote add origin https://github.com/coachcathy/life-coach.git
git push -u origin main
```

In GitHub, open **Settings → Pages**, choose **Deploy from a branch**, then select **main** and **/(root)**.

## Data storage

Data remains in browser LocalStorage. Export a backup before clearing browser data or changing devices.
