# Data dictionary

The dashboard reads two generated files in `public/data/`. Both are produced by `scripts/prepare_data.py` from `data/source/Cleaned_Opportunity_Dataset_Updated.xlsx`. One record = one opportunity. See [DATA_LIMITATIONS.md](DATA_LIMITATIONS.md) for caveats.

## Source columns used

Of the 35 source columns, the dashboard uses six. The rest are excluded (nested JSON references, free text, raw mixed-currency values, or personal data); the full column profile is on the dashboard's **Data limitations** page.

| Source column | Meaning | Dashboard use |
|---|---|---|
| `CATEGORY` | Opportunity type (Internship, Career, Competition, …) | Category filter and charts. Blank → "Uncategorized" (2 records). |
| `CREATED AT` | Date the opportunity was added to the catalogue, grouped into 13 dates during cleaning | Creation-period trend, year chart, period filter. **Not** applicant sign-up or application date. |
| `LOCATION` | Delivery mode: Work From Home, Virtual, Unspecified | Delivery-mode filter and charts. Blank → "Not recorded". **Not** applicant location. |
| `microscholarship_usd` | Scholarship amount converted to USD in the cleaned file | Scholarship status, coverage, medians, distribution. |
| `fee_usd` | Participation fee converted to USD | Free vs paid status only (amounts unreliable). |
| `IS ARCHIVED` | Whether the listing is archived | Listing-status filter. |
| `NAME` | Opportunity title | Not exported. Used only to compute the likely-test-record flag. |
| `CODE` | Short opportunity code | Not exported per record. Identifies outliers for verification. |

## `opportunities.json`: one compact record per opportunity

| Key | Decoded as | Values |
|---|---|---|
| `c` | `category` | Category name, or `Uncategorized` |
| `l` | `location` | `Work From Home`, `Virtual`, `Unspecified`, `Not recorded` |
| `p` | `period` | Index into `summary.periods` (0–12), or `null` when `CREATED AT` is blank |
| `s` | `scholarship` | `offers` (USD > 0), `zero` (USD = 0), `unknown` (USD blank) |
| `a` | `amount` | USD amount rounded to cents, or `null` when unknown |
| `f` | `fee` | `free` (fee_usd = 0), `paid` (> 0), `unknown` (blank) |
| `ar` | `archived` | `1` when archived, else `0` |
| `t` | `likelyTest` | `1` when `NAME` matches the likely-test-record heuristic, else `0` |

Decoding happens in `src/utils/decode.js`; `year` is derived from the period.

## `summary.json`: metadata and precomputed statistics

| Key | Contents |
|---|---|
| `source` | File name, sheets, row/column counts, unique opportunity IDs |
| `coverage` | First and last creation period, count of undated records |
| `periods` | The 13 creation periods: index, anchor date, year, label |
| `dateBinning` | Evidence that creation dates were grouped (spacing, timestamp comparison) |
| `categories`, `locations` | Counts per value; small-sample flags |
| `scholarship`, `scholarshipStatus`, `scholarshipUnknownDetail` | Scholarship statistics and the three-status split |
| `currencyConversion`, `fee`, `archived`, `durationUnits` | Supporting profile figures |
| `likelyTestRecords` | Heuristic counts overall, per period and per year |
| `outliers` | Ten largest scholarship amounts, identified by code |
| `applicantFieldScan`, `transactionReferenceCounts` | Evidence that applicant/outreach metrics are unavailable |
| `reconciliation` | Week 2 figures vs recomputed values |
| `columnProfile` | Completeness and usage of all 35 source columns |

## Derived definitions

| Term | Definition |
|---|---|
| Opportunity record | One row of the source file (one `OPPORTUNITY ID`) |
| Offers a scholarship | `microscholarship_usd > 0` |
| Scholarship coverage rate | Records offering a scholarship ÷ all records in the group (including $0 and unknown) |
| Median scholarship | Median USD amount among records that offer one (pandas convention: mean of the two middle values) |
| Free to join | `fee_usd = 0`, as a share of records with a known fee |
| Delivery mode recorded | `LOCATION` is not blank, as a share of all records |
| Creation period | One of 13 grouped `CREATED AT` dates, each covering roughly four months |
| Likely test record | `NAME` contains "automation" plus a 13-digit timestamp, or a word starting with "test". A heuristic, not a confirmed classification. |
| Extreme scholarship value | USD amount of $1,000,000 or more |
| Small sample | Category with fewer than 10 records |
