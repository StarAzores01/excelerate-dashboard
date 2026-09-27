# Data limitations

What the Excelerate opportunity dataset can and cannot support, and how the dashboard handles each issue. All figures are computed by `scripts/prepare_data.py` from `Cleaned_Opportunity_Dataset_Updated.xlsx` (5,730 rows, 35 columns). The same content appears on the dashboard's **Data limitations** page.

## 1. The dataset describes opportunities, not applicants

There is one row per opportunity (5,730 unique `OPPORTUNITY ID` values). There are no applicant-level or marketing fields. The data script scans every column name for applicant, application, sign-up, location and channel keywords, and finds none.

Two consequences:

- **`CREATED AT` is when an opportunity was added to the catalogue.** It is not applicant sign-up or application activity, and the dashboard never labels it as such.
- **`LOCATION` is the opportunity's delivery mode** (Work From Home, Virtual, Unspecified, or blank). It is not applicant geography.

### Metrics marked "Data unavailable"

| Requested metric | Why it cannot be calculated | Data required |
|---|---|---|
| Opportunities with the highest/lowest sign-ups | No sign-up or application counts | Applicant ID, opportunity ID (already present as a join key), sign-up/application date, status |
| Application trends over time | `CREATED AT` records catalogue publishing, not applications | One row per application with a timestamp |
| Applications by applicant location | `LOCATION` is delivery mode, not applicant geography | Applicant country (and optionally region/city) |
| Outreach-channel performance | No channel, source or campaign fields | Channel or UTM source, campaign, impressions, clicks, sign-ups, applications, conversions |

`NOT STARTED TRANSACTION` (11 records) and `DROPOUT TRANSACTION` (10 records) contain nested references to other records, not applicant rows, so they cannot support these metrics either. No values are estimated or imputed for any of them.

## 2. Likely test records (heuristic)

4,415 of 5,730 records (77.1%) have names matching a test-data pattern:

- 3,830 contain "automation" plus a 13-digit timestamp (e.g. "Internship Automation 1689922988424").
- 588 contain a word starting with "test" ("contest" and "latest" are not matched).

**This is a heuristic based on the `NAME` field, not a confirmed classification.** It has not been checked against the source system. It can miss test records (names like "abc" or lorem-ipsum text are not caught), and it could in principle flag a genuine record. Records are flagged, not deleted. The "Exclude likely test records" filter lets you compare both views, and the dashboard shows which view is active under **Current selection**.

The flag changes the picture substantially:

- 90.6% of the Jul 2023 period and 94.7% of the Oct 2024 period match the pattern.
- With flagged records excluded, the Jul 2023 period falls from 1,052 to 99 records, and the busiest period becomes Oct 2025 (251).
- Year totals without flagged records are 2022: 16, 2023: 426, 2024: 298, 2025: 398, 2026: 174. So 2024 moves from the largest year to third.
- The median scholarship among offering records falls from $120 to $94.

Confirm with the data owner which records form the real catalogue before presenting final insights.

## 3. Creation dates are grouped into periods

- `CREATED AT` has only 13 distinct values, spaced 115–116 days apart (8 Aug 2022 to 28 May 2026).
- For 3,863 records whose names embed a real timestamp, 99.0% have `CREATED AT` equal to the nearest of those 13 dates (median offset 27.6 days).
- Trends are therefore shown per ~4-month period. Month-level claims (such as a "July 2023 spike") are not supported, and records near a year boundary may fall in the neighbouring year.
- 4 records have no creation date. They are included only when the full period range is selected.
- 2026 is a partial year (the last period is May 2026).

## 4. Scholarship amounts

- **Three statuses are kept separate:** offers (USD > 0): 4,914; $0 recorded: 473 (meaning ambiguous); amount unknown: 343. Of the unknown, 337 have a source amount of 0 with no currency, 3 have a positive amount with no currency, and 3 have no amount. Nothing is recoded to $0.
- **Two extreme values:** $10,000,000 (Event, code EVWV6D6, archived) and $5,254,308.53 (JobSimulation, code JZL6EIP, converted from ₹500,000,000). Together they raise the mean of known amounts from $172.12 to $3,003.74. They are kept, listed for verification, and medians are used instead of means.
- **$120 dominates:** 3,713 records are exactly $120, so the 25th percentile, median and 75th percentile are all $120. It may be a platform default.
- **Currency conversion is undocumented.** The cleaned file converts EUR at about 1.14 USD and INR at about 0.0105 USD. The rate source and date are unknown.

## 5. Other fields

- **Delivery mode missing:** 1,442 records (25.2%) have no `LOCATION`. They are shown as "Not recorded".
- **Fee amounts are unreliable:** `fee_usd` reaches $6 trillion, so only the free/paid split is shown.
- **Small categories:** Program (2), Xploreu (2) and Uncategorized (2) are marked as small samples.
- **`LAST DATE TO APPLY`** contains a 1970-01-01 placeholder and the same grouped dates, so it is not used.

## 6. Personal data

`CURRENT EDITOR` contains staff email addresses. It is excluded from the dashboard JSON, and the source spreadsheet is git-ignored so it is not pushed to a public repository. Outlier records are identified by opportunity `CODE`, not by name.

## 7. Assumptions

- `microscholarship_usd > 0` means "offers a scholarship". This matches the Week 2 definition.
- The median scholarship KPI is computed over records that offer one.
- All 23 figures in the Week 2 report are reproduced exactly from the spreadsheet (see the reconciliation table on the Data limitations page).
