# Excelerate Opportunity Analytics

Interactive dashboard for the Excelerate Week 3 deliverable (Dashboard Development & Insight Generation). It analyses the cleaned opportunity dataset: 5,730 opportunity records across 35 columns, covering creation periods, categories, delivery modes and scholarships.

The dashboard reports only what the dataset measures. It describes the **opportunity catalogue**, not applicants, so applicant and outreach metrics are shown as **Data unavailable** rather than estimated.

**Documentation**

- [DATA_DICTIONARY.md](DATA_DICTIONARY.md): source columns used, JSON fields, metric definitions
- [DATA_LIMITATIONS.md](DATA_LIMITATIONS.md): what the data cannot support, data-quality issues and their handling
- [docs/REPORT_METRICS.md](docs/REPORT_METRICS.md): verified full-dataset figures for the written report

**Quick start**

```bash
npm install
npm run verify   # checks the dashboard's calculations against the data script's output
npm run dev      # http://localhost:5173
npm run build    # production files in dist/
```

---

## 1. Overview and features

**Pages** (hash navigation, so links like `…/#scholarships` can be shared):

| Page | Contents |
|---|---|
| Overview | KPI strip, creation trend, category and delivery-mode charts, scholarship status, highlights computed from the current selection |
| Opportunities | Creation trend per period, annual comparison (2026 marked partial), category counts, delivery mode, scholarship status within each category (share or count), delivery mode within each category |
| Scholarship analysis | Coverage rate by category, scholarship-bearing counts by category, median amount by category, amount distribution (binned, log or linear scale), mean/median with and without extreme values, ten largest values for verification, treatment of $0 and missing amounts |
| Data limitations | Unavailable applicant/outreach metrics and the fields they need, data-quality issues and their handling, reconciliation against the Week 2 report, full column profile |

**Filters** (apply to every KPI and chart on the first three pages): creation period range, category, delivery mode, scholarship status, listing status (active/archived), and "Exclude likely test records" (a name-pattern heuristic, not a confirmed classification). A **Current selection** line under the filters, and on the Overview highlights, states which filters are applied and whether likely test records are included.

**KPIs:** opportunities, share offering a scholarship, median scholarship, categories, share free to join, share with a delivery mode recorded.

**Interaction:**
- Click a bar in the category, delivery-mode, annual, or per-category charts to filter by it. Click again to clear.
- Click anywhere above a period in the trend chart to select that period.
- A chart that filters by a dimension ignores its own filter, so the other bars stay visible and the selected one is highlighted.
- Tooltips explain each value.
- There are loading, error and empty states.
- The layout is responsive down to phone width.
- Form controls have labels, focus states are visible, and reduced-motion preferences are respected.

Every chart carries a line stating what it counts (for example, "Counts opportunity records by their recorded creation date… not applicant sign-ups").

## 2. Technology stack

- React 19 + Vite 8 (JavaScript)
- Apache ECharts 6 via `echarts-for-react` (only line, bar and pie modules are registered, to keep the bundle small)
- Plain CSS with custom properties (no Tailwind build step needed)
- Public Sans font, bundled from npm (`@fontsource-variable/public-sans`), so there is no external font request
- Python 3 with pandas, numpy and openpyxl, for data preparation only
- Static JSON in `public/data/`; no backend, database, API keys or paid services

## 3. Folder structure

```
excelerate-dashboard/
├── .github/workflows/deploy.yml   Optional GitHub Pages deployment workflow
├── data/source/                   Source spreadsheet (git-ignored, see DATA_LIMITATIONS.md §6)
├── docs/REPORT_METRICS.md         Verified figures for the written report
├── public/data/
│   ├── opportunities.json         One compact record per opportunity (generated)
│   └── summary.json               Metadata, validated statistics, data-quality findings (generated)
├── scripts/
│   ├── prepare_data.py            Excel → JSON, with validation and Week 2 reconciliation
│   └── verify_aggregations.mjs    Checks dashboard calculations against the Python output
├── src/
│   ├── components/
│   │   ├── cards/                 KpiStrip, KpiCard
│   │   ├── charts/                EChart wrapper, ChartPanel, one file per chart
│   │   ├── common/                DataNotice, EmptyState, StatusMessage, SegmentedToggle
│   │   ├── filters/               FilterBar, SelectField
│   │   └── layout/                Header, TabNav
│   ├── hooks/                     useDashboardData, useDashboardModel, useHashPage
│   ├── pages/                     Overview, Opportunities, Scholarship, Limitations
│   ├── utils/                     aggregations, filters, decode, format, constants (pure JS, no React)
│   ├── styles/global.css
│   ├── App.jsx
│   └── main.jsx
├── DATA_DICTIONARY.md
├── DATA_LIMITATIONS.md
├── index.html
├── package.json
├── requirements.txt
└── vite.config.js
```

Calculations live in `src/utils/` as pure functions and are kept separate from the chart components. That is what lets `verify_aggregations.mjs` test them in Node.

## 4. Local installation and startup

Requires **Node.js 20.19+ or 22.12+** (Vite 8 requirement). Check with `node --version`.

In the VS Code terminal, from the project folder:

```bash
npm install
npm run dev
```

Open the URL Vite prints (normally http://localhost:5173).

The processed JSON is already included, so Python is **not** needed to run the dashboard.

### Verifying the calculations

```bash
npm run verify
```

This runs `scripts/verify_aggregations.mjs` in Node (no browser needed). It recomputes KPIs, category, delivery-mode, year and scholarship figures with the same functions the dashboard uses, and compares them with the statistics the Python script computed independently (`public/data/summary.json`). It also checks that every breakdown sums to its total, that filters narrow consistently, and that the "Current selection" label matches the filters. It prints `All checks passed.` (43 checks) or exits with an error listing each failure.

### Using the dashboard

1. **Pick a page** from the tabs: Overview, Opportunities, Scholarship analysis, Data limitations. The URL hash (`#scholarships`) can be shared.
2. **Filter** with the controls at the top, or click a bar, slice or trend point. Clicking the same item again clears it. The **Current selection** line shows what is applied.
3. **Compare with and without likely test records** using the checkbox. The flag is a heuristic, so check both views before drawing conclusions.
4. **Reset filters** (top right, shows the number of active filters) returns to the full dataset.
5. If a selection leaves nothing to show, each chart displays a "Nothing to show" message instead of an empty axis.
6. Hover over a chart for exact counts and percentages. The **Data limitations** page lists the metrics that are unavailable and why.

## 5. Regenerating the JSON from the Excel dataset

Only needed when the spreadsheet changes. Python 3.10+ is required.

```bash
# optional: create a virtual environment
python -m venv .venv
# Windows:        .venv\Scripts\activate
# macOS / Linux:  source .venv/bin/activate

pip install -r requirements.txt
python scripts/prepare_data.py
npm run verify
```

- By default the script reads `data/source/Cleaned_Opportunity_Dataset_Updated.xlsx`. To use another file, run `python scripts/prepare_data.py --input path/to/file.xlsx`.
- It prints a reconciliation table against the Week 2 report and exits with an error if any internal consistency check fails.
- `npm run verify` then confirms that the dashboard's JavaScript calculations reproduce the Python statistics (43 checks).
- On macOS/Linux you may need `python3` instead of `python`.

## 6. Production build

```bash
npm run build      # outputs to dist/
npm run preview    # serves dist/ locally to check the build
```

## 7. Deploying to GitHub Pages

**Base path.** GitHub Pages serves project sites from `https://<username>.github.io/<repository>/`, so asset paths must work from that sub-path. `vite.config.js` sets `base: './'` (relative paths), which works for any repository name. Data is fetched through `import.meta.env.BASE_URL`, and page navigation uses URL hashes, so no server routing is required.

If you prefer an absolute base path, build with the environment variable set:

```bash
# macOS / Linux
VITE_BASE_PATH=/your-repo-name/ npm run build
# Windows PowerShell
$env:VITE_BASE_PATH="/your-repo-name/"; npm run build
```

**Option A: GitHub Actions (included)**

1. Push the project to a GitHub repository with `main` as the default branch.
2. In the repository, open **Settings → Pages → Build and deployment**, and set **Source** to **GitHub Actions**.
3. Push to `main`, or run the workflow manually from the **Actions** tab. The workflow runs `npm ci`, `npm run verify` and `npm run build`, then publishes `dist/`.
4. The site URL appears in the workflow run and under **Settings → Pages**.

`package-lock.json` must be committed, because `npm ci` requires it.

**Option B: manual `gh-pages` branch**

```bash
npm run build
npx gh-pages -d dist
```

Then set **Settings → Pages → Source** to **Deploy from a branch**, and choose the `gh-pages` branch with the `/ (root)` folder.

**Deployment checklist**

- Before pushing: `npm run verify` and `npm run build` both succeed, and `npm run preview` loads the dashboard with data.
- `public/data/opportunities.json` and `public/data/summary.json` are committed (the build copies them to `dist/data/`).
- `data/source/*.xlsx` is **not** committed.
- The repository is public, or your GitHub plan supports Pages for private repositories.
- After deploying: open `https://<username>.github.io/<repository>/` (with the trailing slash), confirm the KPI strip shows 5,730 records, and try `#scholarships` and `#limitations`. If you see "The dashboard data could not be loaded", check that the JSON files were deployed.

## 8. Metrics the dataset supports

| Metric | Source field(s) |
|---|---|
| Opportunity count, overall and by any filter | one row per `OPPORTUNITY ID` (5,730 unique) |
| Creation trend per period, and per year | `CREATED AT` (grouped into 13 periods; see DATA_LIMITATIONS.md §3) |
| Category distribution | `CATEGORY` |
| Delivery-mode distribution | `LOCATION` (Work From Home, Virtual, Unspecified, or blank) |
| Scholarship availability, coverage rate, amounts, medians | `microscholarship_usd` |
| Free vs paid | `fee_usd` (status only) |
| Active vs archived | `IS ARCHIVED` |
| Category × scholarship status, category × delivery mode | combinations of the above |

## 9. Metrics that cannot be calculated (Data unavailable)

The dataset has one row per opportunity and **no applicant-level or marketing fields**, so these four requested metrics are shown on the dashboard as **Data unavailable**, with the reason and the data that would be needed. No values are estimated.

- Opportunities with the highest/lowest sign-ups
- Application trends over time (`CREATED AT` is when an opportunity was added, not when anyone applied)
- Applications by applicant location (`LOCATION` is delivery mode, not applicant geography)
- Outreach-channel performance

Details and required fields: [DATA_LIMITATIONS.md §1](DATA_LIMITATIONS.md#1-the-dataset-describes-opportunities-not-applicants).

## 10. Data-quality findings, assumptions and limitations

All findings are computed by `scripts/prepare_data.py`, shown on the dashboard's **Data limitations** page, and documented in [DATA_LIMITATIONS.md](DATA_LIMITATIONS.md). In brief:

- All 23 figures in the Week 2 report reconcile exactly with the spreadsheet.
- **Likely test records:** 4,415 of 5,730 records (77.1%) match a name-pattern heuristic. This is not a confirmed classification. Excluding them changes the trend, the largest year and the median scholarship.
- **Grouped dates:** `CREATED AT` has only 13 distinct values about four months apart, so trends are per period, not per month. 2026 is partial. 4 records are undated.
- **Missing delivery mode:** 1,442 records (25.2%), shown as "Not recorded".
- **Scholarships:** two extreme values ($10M and $5.25M) distort the mean, so medians are used. 3,713 records are exactly $120. $0 and unknown amounts are kept separate. Currency conversion rates are undocumented.
- **Fees:** `fee_usd` amounts are unreliable, so only the free/paid split is shown.
- **Personal data:** `CURRENT EDITOR` (staff emails) is excluded, and the spreadsheet is git-ignored.

Verified report figures, with denominators: [docs/REPORT_METRICS.md](docs/REPORT_METRICS.md).

## 11. Manual steps for you

1. Install Node.js 20.19+ (and Python 3.10+ if you will regenerate data).
2. Run `npm install`, then `npm run dev`.
3. Create a GitHub repository, commit everything including `package-lock.json` and `public/data/`, and push.
4. Choose a deployment option from section 7 and configure **Settings → Pages**.
5. Keep `data/source/*.xlsx` out of the public repository (already in `.gitignore`). If you remove that line, the staff emails in the spreadsheet become public.
6. Decide with your supervisor whether the Week 3 insights should use all records or exclude likely test records, and state the choice in your report.
