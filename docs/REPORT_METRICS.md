# Report metrics: Excelerate opportunity dataset

Verified figures for the Week 3 report. Every value was produced by the dashboard's own aggregation functions (`src/utils/aggregations.js`) over `public/data/opportunities.json`, and the headline totals are cross-checked against the independent Python output (`summary.json`) by `npm run verify`. Values match what the dashboard shows with no filters applied.

- **Source:** `Cleaned_Opportunity_Dataset_Updated.xlsx`, 1 sheet, 5,730 rows × 35 columns, 5,730 unique opportunity IDs, 0 duplicates.
- **Unit of analysis:** one opportunity record. **No figure here describes applicants, sign-ups, applications or outreach.**
- **Date coverage:** creation periods from 8 Aug 2022 to 28 May 2026 (13 grouped dates about four months apart). 5,726 records dated, 4 undated. 2026 is a partial year.
- **Default view:** all records, including likely test records. Section 6 gives the same figures with likely test records excluded.

## 1. Headline figures (full dataset)

| Metric | Value | Numerator / denominator |
|---|---|---|
| Opportunity records | 5,730 | all rows |
| Offer a scholarship | 85.8% | 4,914 / 5,730 records |
| Median scholarship | $120 | median over 4,914 records offering one |
| Categories | 10 | distinct non-blank `CATEGORY` values (plus 2 uncategorized records) |
| Free to join | 78.0% | 4,204 / 5,388 records with a known fee |
| Delivery mode recorded | 74.8% | 4,288 / 5,730 records |
| Archived listings | 6.7% | 384 / 5,730 records |
| Likely test records (heuristic) | 77.1% | 4,415 / 5,730 records |

## 2. Opportunities created per year and per period

Counts of opportunity records by recorded creation date. This is catalogue publishing activity, **not** applicant sign-ups.

| Year | Records | Share of 5,730 |
|---|---|---|
| 2022 | 24 | 0.4% |
| 2023 | 2,123 | 37.1% |
| 2024 | 2,128 | 37.1% |
| 2025 | 895 | 15.6% |
| 2026 (partial, to May) | 556 | 9.7% |
| No date | 4 | – |

Per period: Aug 2022: 14 · Dec 2022: 10 · Mar 2023: 274 · **Jul 2023: 1,052** · Nov 2023: 797 · Mar 2024: 977 · Jul 2024: 542 · Oct 2024: 609 · Feb 2025: 320 · Jun 2025: 227 · Oct 2025: 348 · Feb 2026: 497 · May 2026: 59.

Each period label is the grouped date and covers roughly four months, so "Jul 2023" is not a single month. 90.6% of its records are flagged as likely test records (see section 6).

## 3. Opportunities by category

| Category | Records | Share of 5,730 | Offer a scholarship (coverage) | Median scholarship |
|---|---|---|---|---|
| Internship | 1,591 | 27.8% | 81.8% (1,302) | $120 |
| Career | 1,088 | 19.0% | 80.0% (870) | $120 |
| Competition | 734 | 12.8% | 91.0% (668) | $120 |
| Course | 632 | 11.0% | 88.4% (559) | $120 |
| Event | 622 | 10.9% | 88.9% (553) | $120 |
| Engagement | 459 | 8.0% | 89.8% (412) | $120 |
| Masterclass | 400 | 7.0% | 94.8% (379) | $120 |
| JobSimulation | 198 | 3.5% | 84.3% (167) | $120 |
| Program* | 2 | <0.1% | 2 of 2 | $8.17 |
| Xploreu* | 2 | <0.1% | 2 of 2 | $12.69 |
| Uncategorized* | 2 | <0.1% | 0 of 2 | – |

\* Small sample (fewer than 10 records). Do not compare rates.
Coverage = records offering a scholarship ÷ all records in the category. Median = over records offering one.

## 4. Delivery mode (`LOCATION`)

Delivery mode of the opportunity, **not** applicant location.

| Delivery mode | Records | Share of 5,730 | Share of 4,288 recorded |
|---|---|---|---|
| Work From Home | 2,356 | 41.1% | 54.9% |
| Virtual | 1,917 | 33.5% | 44.7% |
| Unspecified | 15 | 0.3% | 0.3% |
| Not recorded (blank) | 1,442 | 25.2% | – |

99.7% of records with a recorded delivery mode are Work From Home or Virtual (4,273 / 4,288).

## 5. Scholarships

| Status | Records | Share of 5,730 |
|---|---|---|
| Offers a scholarship (USD > 0) | 4,914 | 85.8% |
| $0 recorded | 473 | 8.3% |
| Amount unknown (USD blank) | 343 | 6.0% |

| Statistic (5,387 records with a known USD amount, incl. $0) | All values | Excluding 2 values ≥ $1M |
|---|---|---|
| Mean | $3,003.74 | $172.12 |
| Median | $120 | $120 |
| Maximum | $10,000,000 | $16,558.50 |

- Median among the 4,914 records offering a scholarship: **$120**. 25th and 75th percentiles of known amounts are also $120.
- 3,713 records are exactly $120 (75.6% of those offering one; 64.8% of all records).
- Amount distribution of offering records: under $1: 136 · $1–9: 203 · $10–99: 381 · $100–119: 121 · exactly $120: 3,713 · $121–499: 156 · $500–999: 24 · $1k–9.9k: 174 · $10k–999k: 4 · $1M+: 2.
- The two extreme values are $10,000,000 (Event, code EVWV6D6, archived) and $5,254,308.53 (JobSimulation, code JZL6EIP, converted from ₹500,000,000). Verify both before any financial use. Report medians, not means.

## 6. Sensitivity: likely test records excluded

The likely-test-record flag is a **name-pattern heuristic, not a confirmed classification** ("automation" + a 13-digit timestamp, or a word starting with "test"). Excluding the 4,415 flagged records leaves 1,315.

| Metric | All records | Likely test excluded |
|---|---|---|
| Opportunity records | 5,730 | 1,315 |
| Offer a scholarship | 85.8% (4,914) | 73.4% (965) |
| Median scholarship (offering) | $120 | $94 |
| Free to join (known fee) | 78.0% | 74.8% (967 / 1,292) |
| Delivery mode recorded | 74.8% | 75.1% (987 / 1,315) |
| Largest category | Internship 27.8% | Internship 49.7% (654) |
| Busiest creation period | Jul 2023 (1,052) | Oct 2025 (251) |
| Year totals 2022 / 2023 / 2024 / 2025 / 2026 | 24 / 2,123 / 2,128 / 895 / 556 | 16 / 426 / 298 / 398 / 174 |

Conclusions about publishing volume, the 2023–2024 peak and the dominance of $120 awards depend heavily on this choice. State which view the report uses.

## 7. Metrics not available from this dataset

Shown on the dashboard as **Data unavailable**. No values are estimated.

| Metric | Reason |
|---|---|
| Opportunities with highest/lowest sign-ups | No sign-up or application counts |
| Application trends over time | `CREATED AT` is when an opportunity was added, not when anyone applied |
| Applications by applicant location | `LOCATION` is delivery mode; no applicant geography |
| Outreach-channel performance | No channel, source or campaign fields |

## 8. Limitations to state in the report

1. Opportunity catalogue data only: no applicant, application or outreach data.
2. Creation dates were grouped into 13 periods, so there are no month-level trends. 2026 is partial.
3. Most records (77.1%) match a test-data name pattern. The flag is a heuristic and has not been confirmed with the data owner.
4. 25.2% of records have no delivery mode.
5. Two extreme scholarship values distort means. $120 may be a platform default. Currency conversion rates are undocumented.
6. `fee_usd` amounts are unreliable (maximum $6 trillion); only the free/paid split is used.
7. All 23 Week 2 figures reconcile exactly with this dataset.

Full detail: [DATA_LIMITATIONS.md](../DATA_LIMITATIONS.md). Field definitions: [DATA_DICTIONARY.md](../DATA_DICTIONARY.md).
