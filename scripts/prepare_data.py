#!/usr/bin/env python3
"""
Prepare dashboard JSON from the cleaned Excelerate opportunity dataset.

Usage (from the project root):
    python scripts/prepare_data.py
    python scripts/prepare_data.py --input path/to/other.xlsx

Outputs:
    public/data/opportunities.json  - one compact record per opportunity (no free text, no emails)
    public/data/summary.json        - metadata, validated statistics, data-quality findings

The production dashboard only reads these JSON files. Python is needed only when
the source spreadsheet changes.

The script exits with status 1 if an internal consistency check fails.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = PROJECT_ROOT / "data" / "source" / "Cleaned_Opportunity_Dataset_Updated.xlsx"
OUTPUT_DIR = PROJECT_ROOT / "public" / "data"

# Values at or above this USD amount are listed as "requires verification".
# The dataset's interquartile range is zero (Q1 = Q3 = $120), so an IQR rule would
# flag every non-$120 value. A fixed, documented threshold is more useful here.
EXTREME_SCHOLARSHIP_USD = 1_000_000

# Categories with fewer records than this are marked "small sample" in the UI.
SMALL_SAMPLE_THRESHOLD = 10

LOCATION_MISSING_LABEL = "Not recorded"
CATEGORY_MISSING_LABEL = "Uncategorized"

# Figures reported in the Week 2 EDA deliverable, used only for reconciliation.
# They are never written into the dashboard as values.
WEEK2_REPORTED = {
    "total_records": 5730,
    "total_attributes": 35,
    "records_with_creation_date": 5726,
    "records_with_location": 4288,
    "records_with_scholarship_value": 5387,
    "offering_scholarship": 4914,
    "offering_scholarship_pct": 85.8,
    "missing_location": 1442,
    "missing_scholarship_value": 343,
    "scholarship_mean_usd": 3003.74,
    "scholarship_median_usd": 120.0,
    "scholarship_p25_usd": 120.0,
    "scholarship_p75_usd": 120.0,
    "scholarship_min_usd": 0.0,
    "scholarship_max_usd": 10_000_000.0,
    "duplicate_records": 0,
    "weeks_duration_unit": 4287,
    "created_2022": 24,
    "created_2023": 2123,
    "created_2024": 2128,
    "created_2025": 895,
    "created_2026": 556,
    "largest_creation_group_jul_2023": 1052,
}

# Keyword patterns that would indicate applicant-level or outreach data.
APPLICANT_OR_OUTREACH_KEYWORDS = [
    "applicant", "application", "apply_date", "signup", "sign_up", "sign up",
    "registration", "user_id", "student", "channel", "source", "utm",
    "campaign", "referral", "impression", "click", "conversion", "country",
    "city", "state", "region",
]

# Columns deliberately excluded from the dashboard output, with the reason.
EXCLUDED_COLUMNS = {
    "PK": "Constant value ('Opportunity#'); carries no information.",
    "OPPORTUNITY ID": "Internal key; not needed for aggregation.",
    "BADGE": "Nested JSON references to related records.",
    "CAREER ADD ON": "Nested JSON references to related records.",
    "CODE": "Short opportunity code; used only to identify outliers for verification.",
    "COHORT": "Nested JSON references to related records.",
    "CURRENCY TYPE": "Used during processing to interpret amounts; not exported per record.",
    "CURRENT EDITOR": "Contains staff email addresses (personal data).",
    "DROPOUT TRANSACTION": "Sparse JSON references to transaction records; not applicant data.",
    "DURATION": "Mixed units (minutes to years); not used in this baseline.",
    "DURATION TYPE": "Profiled only (unit distribution).",
    "ELIGIBILITY": "Nested JSON references to related records.",
    "FEE": "Raw fee in mixed currencies; fee_usd is used instead.",
    "IMAGE LINK": "Image URLs; not analytical.",
    "IS AUTO APPROVED": "Administrative flag; not used in this baseline.",
    "LAST DATE TO APPLY": "Snapped to the same 13 anchor dates as CREATED AT and contains placeholder dates (e.g. 1970-01-01).",
    "LONG DESCRIPTION": "Free text.",
    "MICROSCHOLARSHIP": "Raw amount in mixed currencies; microscholarship_usd is used instead.",
    "MODIFIED AT": "Snapped to anchor dates; not used in this baseline.",
    "NAME": "Free text; used only to flag likely test records.",
    "NOT STARTED TRANSACTION": "Sparse JSON references to transaction records; not applicant data.",
    "PANELIST": "Nested JSON references to related records.",
    "REWARD": "Nested JSON references to related records.",
    "ROLE": "Sparse free text.",
    "ROLE RESPONSIBILITY": "Sparse free text.",
    "SHORT DESCRIPTION": "Free text.",
    "SUMMARY": "Sparse free text.",
    "TESTIMONIAL": "Nested JSON references to related records.",
    "TRACKING QUESTION": "Nested JSON form definitions.",
}
USED_COLUMNS = {
    "CATEGORY": "Category filter and charts.",
    "CREATED AT": "Creation-period trend and year filter.",
    "LOCATION": "Delivery mode filter and charts.",
    "microscholarship_usd": "Scholarship status and amounts (USD).",
    "fee_usd": "Free vs paid split only (amounts contain extreme values).",
    "IS ARCHIVED": "Status filter.",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def to_float(value) -> float | None:
    """Convert numpy/pandas scalars to a JSON-safe float, keeping missing as None."""
    if value is None or (isinstance(value, float) and math.isnan(value)) or pd.isna(value):
        return None
    return round(float(value), 2)


def pct(part: int, whole: int) -> float:
    return round(part / whole * 100, 1) if whole else 0.0


class ValidationError(Exception):
    pass


def check(condition: bool, message: str) -> None:
    if not condition:
        raise ValidationError(message)


# ---------------------------------------------------------------------------
# Load and profile
# ---------------------------------------------------------------------------

def load_workbook(path: Path) -> tuple[pd.DataFrame, list[dict]]:
    sheets = pd.read_excel(path, sheet_name=None)
    sheet_info = [{"name": name, "rows": int(len(frame)), "columns": int(frame.shape[1])}
                  for name, frame in sheets.items()]
    # The opportunity table is the sheet containing the expected key columns.
    for name, frame in sheets.items():
        if {"CATEGORY", "CREATED AT", "microscholarship_usd"}.issubset(frame.columns):
            return frame, sheet_info
    raise ValidationError("No worksheet contains CATEGORY, CREATED AT and microscholarship_usd.")


def profile_columns(frame: pd.DataFrame) -> list[dict]:
    profile = []
    for column in frame.columns:
        series = frame[column]
        role = "used" if column in USED_COLUMNS else "excluded"
        note = USED_COLUMNS.get(column) or EXCLUDED_COLUMNS.get(column, "Not used.")
        profile.append({
            "column": column,
            "dtype": str(series.dtype),
            "nonNull": int(series.notna().sum()),
            "nulls": int(series.isna().sum()),
            "unique": int(series.nunique(dropna=True)),
            "role": role,
            "note": note,
        })
    return profile


# ---------------------------------------------------------------------------
# Normalization
# ---------------------------------------------------------------------------

def flag_likely_test_records(names: pd.Series) -> tuple[pd.Series, dict]:
    """
    Conservative name-pattern heuristic. It is a lower bound: many placeholder names
    ('abc', 'fkfk', lorem-ipsum text) are not caught, and a real opportunity could
    in principle match. Records are flagged, never deleted.
    """
    text = names.fillna("").astype(str)
    automation_with_timestamp = (
        text.str.contains("automation", case=False) & text.str.contains(r"\d{13}", regex=True)
    )
    # 'test' at the start of a word: matches Test, testing, TEST_x; skips 'contest', 'latest'.
    test_word = text.str.contains(r"(?<![a-z])test", case=False, regex=True)
    flagged = automation_with_timestamp | test_word
    return flagged, {
        "automationWithTimestamp": int(automation_with_timestamp.sum()),
        "testWord": int(test_word.sum()),
        "flaggedTotal": int(flagged.sum()),
    }


def verify_date_binning(frame: pd.DataFrame, anchors: list[pd.Timestamp]) -> dict:
    """
    Many automated test names embed a 13-digit millisecond timestamp. Comparing it
    with CREATED AT shows whether dates were snapped to anchor dates during cleaning.
    """
    names = frame["NAME"].fillna("").astype(str)
    embedded_ms = names.str.extract(r"(\d{13})")[0].astype(float)
    embedded = pd.to_datetime(embedded_ms, unit="ms")
    comparable = frame.assign(_embedded=embedded).dropna(subset=["_embedded", "CREATED AT"])
    if comparable.empty:
        return {"recordsCompared": 0}
    anchor_ns = np.array([a.value for a in anchors])
    embedded_ns = comparable["_embedded"].astype("datetime64[ns]").astype("int64").to_numpy()
    created_ns = comparable["CREATED AT"].astype("datetime64[ns]").astype("int64").to_numpy()
    nearest = anchor_ns[np.abs(embedded_ns[:, None] - anchor_ns[None, :]).argmin(axis=1)]
    offset_days = (created_ns - embedded_ns) / 86_400e9
    matched = nearest == created_ns
    return {
        "recordsCompared": int(len(comparable)),
        "matchNearestAnchorPct": pct(int(matched.sum()), len(comparable)),
        "medianAbsOffsetDays": round(float(np.median(np.abs(offset_days[matched]))), 1),
        "maxAbsOffsetDaysWhenMatched": round(float(np.abs(offset_days[matched]).max()), 1),
    }


def normalize(frame: pd.DataFrame) -> tuple[pd.DataFrame, list[dict], dict]:
    data = pd.DataFrame(index=frame.index)

    data["category"] = frame["CATEGORY"].fillna(CATEGORY_MISSING_LABEL).astype(str).str.strip()
    data["location"] = frame["LOCATION"].fillna(LOCATION_MISSING_LABEL).astype(str).str.strip()

    created = pd.to_datetime(frame["CREATED AT"], errors="coerce")
    anchors = sorted(created.dropna().unique())
    anchors = [pd.Timestamp(a) for a in anchors]
    period_lookup = {a: i for i, a in enumerate(anchors)}
    data["period"] = created.map(lambda d: period_lookup.get(pd.Timestamp(d)) if pd.notna(d) else None)

    usd = pd.to_numeric(frame["microscholarship_usd"], errors="coerce")
    data["scholarship"] = np.select(
        [usd.isna(), usd == 0, usd > 0], ["unknown", "zero", "offers"], default="unknown"
    )
    data["amount"] = usd.round(2)

    fee = pd.to_numeric(frame["fee_usd"], errors="coerce")
    data["fee"] = np.select([fee.isna(), fee == 0, fee > 0], ["unknown", "free", "paid"], default="unknown")

    data["archived"] = frame["IS ARCHIVED"].fillna(False).astype(bool)

    likely_test, test_counts = flag_likely_test_records(frame["NAME"])
    data["likelyTest"] = likely_test

    periods = []
    for i, anchor in enumerate(anchors):
        periods.append({
            "index": i,
            "date": anchor.strftime("%Y-%m-%d"),
            "year": int(anchor.year),
            "label": anchor.strftime("%b %Y"),
        })
    return data, periods, test_counts


# ---------------------------------------------------------------------------
# Statistics
# ---------------------------------------------------------------------------

def scholarship_stats(amounts: pd.Series) -> dict:
    known = amounts.dropna()
    positive = known[known > 0]
    without_extreme = known[known < EXTREME_SCHOLARSHIP_USD]
    return {
        "knownValues": int(len(known)),
        "positiveValues": int(len(positive)),
        "meanKnown": to_float(known.mean()),
        "medianKnown": to_float(known.median()),
        "p25Known": to_float(known.quantile(0.25)),
        "p75Known": to_float(known.quantile(0.75)),
        "minKnown": to_float(known.min()),
        "maxKnown": to_float(known.max()),
        "medianPositive": to_float(positive.median()),
        "meanPositive": to_float(positive.mean()),
        "meanKnownExcludingExtreme": to_float(without_extreme.mean()),
        "extremeThresholdUsd": EXTREME_SCHOLARSHIP_USD,
        "extremeCount": int((known >= EXTREME_SCHOLARSHIP_USD).sum()),
        "exactly120Count": int((known == 120).sum()),
    }


def build_outliers(frame: pd.DataFrame, data: pd.DataFrame, periods: list[dict], top_n: int = 10) -> list[dict]:
    """Largest USD scholarship values, identified by opportunity CODE for verification."""
    top = data["amount"].dropna().sort_values(ascending=False).head(top_n)
    rows = []
    for idx, amount in top.items():
        period_index = data.at[idx, "period"]
        rows.append({
            "code": None if pd.isna(frame.at[idx, "CODE"]) else str(frame.at[idx, "CODE"]),
            "category": data.at[idx, "category"],
            "amountUsd": to_float(amount),
            "rawAmount": to_float(frame.at[idx, "MICROSCHOLARSHIP"]),
            "rawCurrency": None if pd.isna(frame.at[idx, "CURRENCY TYPE"]) else str(frame.at[idx, "CURRENCY TYPE"]),
            "period": None if period_index is None or pd.isna(period_index) else periods[int(period_index)]["date"],
            "archived": bool(data.at[idx, "archived"]),
            "likelyTest": bool(data.at[idx, "likelyTest"]),
            "extreme": bool(amount >= EXTREME_SCHOLARSHIP_USD),
        })
    return rows


def test_share_by_period(data: pd.DataFrame, periods: list[dict]) -> list[dict]:
    """How concentrated likely test records are in each creation period."""
    dated = data.dropna(subset=["period"])
    rows = []
    for period in periods:
        in_period = dated[dated["period"].astype(int) == period["index"]]
        flagged = int(in_period["likelyTest"].sum())
        rows.append({"label": period["label"], "total": int(len(in_period)), "likelyTest": flagged,
                     "other": int(len(in_period)) - flagged, "likelyTestPct": pct(flagged, len(in_period))})
    return rows


def test_share_by_year(data: pd.DataFrame, periods: list[dict]) -> list[dict]:
    dated = data.dropna(subset=["period"])
    years = dated["period"].astype(int).map(lambda i: periods[i]["year"])
    rows = []
    for year in sorted(years.unique()):
        in_year = dated[years == year]
        flagged = int(in_year["likelyTest"].sum())
        rows.append({"year": int(year), "total": int(len(in_year)), "likelyTest": flagged,
                     "other": int(len(in_year)) - flagged})
    return rows


def find_applicant_fields(columns: list[str]) -> list[str]:
    hits = []
    for column in columns:
        lowered = column.lower()
        if any(keyword in lowered for keyword in APPLICANT_OR_OUTREACH_KEYWORDS):
            hits.append(column)
    return hits


# ---------------------------------------------------------------------------
# Validation and reconciliation
# ---------------------------------------------------------------------------

def validate(frame: pd.DataFrame, data: pd.DataFrame, periods: list[dict]) -> None:
    total = len(frame)
    check(len(data) == total, "Normalized row count differs from source.")
    check(frame["OPPORTUNITY ID"].is_unique, "OPPORTUNITY ID is not unique.")
    status_counts = data["scholarship"].value_counts()
    check(int(status_counts.sum()) == total, "Scholarship statuses do not partition all records.")
    check(int(status_counts.get("unknown", 0)) == int(frame["microscholarship_usd"].isna().sum()),
          "Unknown scholarship count does not match blank microscholarship_usd values.")
    check(int(data["period"].notna().sum()) == int(frame["CREATED AT"].notna().sum()),
          "Some non-blank creation dates were not assigned a period.")
    check(int(data["location"].value_counts().sum()) == total, "Location labels do not cover all records.")
    check(int(data["category"].value_counts().sum()) == total, "Category labels do not cover all records.")
    check(all(periods[i]["date"] < periods[i + 1]["date"] for i in range(len(periods) - 1)),
          "Periods are not strictly increasing.")


def reconcile(frame: pd.DataFrame, data: pd.DataFrame, periods: list[dict], stats: dict,
              largest_period: dict) -> list[dict]:
    total = len(frame)
    offers = int((data["scholarship"] == "offers").sum())
    year_counts = data.dropna(subset=["period"]).assign(
        year=lambda d: d["period"].astype(int).map(lambda i: periods[i]["year"])
    )["year"].value_counts()

    computed = {
        "total_records": total,
        "total_attributes": int(frame.shape[1]),
        "records_with_creation_date": int(frame["CREATED AT"].notna().sum()),
        "records_with_location": int(frame["LOCATION"].notna().sum()),
        "records_with_scholarship_value": stats["knownValues"],
        "offering_scholarship": offers,
        "offering_scholarship_pct": pct(offers, total),
        "missing_location": int(frame["LOCATION"].isna().sum()),
        "missing_scholarship_value": int(frame["microscholarship_usd"].isna().sum()),
        "scholarship_mean_usd": stats["meanKnown"],
        "scholarship_median_usd": stats["medianKnown"],
        "scholarship_p25_usd": stats["p25Known"],
        "scholarship_p75_usd": stats["p75Known"],
        "scholarship_min_usd": stats["minKnown"],
        "scholarship_max_usd": stats["maxKnown"],
        "duplicate_records": int(frame.drop(columns=["OPPORTUNITY ID"]).duplicated().sum()),
        "weeks_duration_unit": int((frame["DURATION TYPE"] == "weeks").sum()),
        "largest_creation_group_jul_2023": largest_period["count"],
    }
    for year in range(2022, 2027):
        computed[f"created_{year}"] = int(year_counts.get(year, 0))

    notes = {
        "largest_creation_group_jul_2023": (
            f"Count is correct, but it is the {largest_period['label']} creation period "
            "(about 4 months), not a single calendar month."
        ),
        "created_2026": "Partial year; dataset ends at the May 2026 period.",
        "scholarship_mean_usd": "Driven by two values of $1M or more; see outliers.",
        "scholarship_max_usd": "Single archived Event record; requires verification before financial use.",
    }
    rows = []
    for key, reported in WEEK2_REPORTED.items():
        value = computed[key]
        match = value is not None and abs(float(value) - float(reported)) <= 0.051
        rows.append({"metric": key, "week2Reported": reported, "computed": value,
                     "match": bool(match), "note": notes.get(key)})
    return rows


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Path to the cleaned .xlsx file")
    args = parser.parse_args()

    if not args.input.exists():
        print(f"Input file not found: {args.input}", file=sys.stderr)
        print("Place the spreadsheet at data/source/Cleaned_Opportunity_Dataset_Updated.xlsx "
              "or pass --input.", file=sys.stderr)
        return 1

    frame, sheet_info = load_workbook(args.input)
    data, periods, test_counts = normalize(frame)

    try:
        validate(frame, data, periods)
    except ValidationError as error:
        print(f"VALIDATION FAILED: {error}", file=sys.stderr)
        return 1

    total = len(frame)
    stats = scholarship_stats(data["amount"])
    period_counts = data["period"].value_counts()
    largest_index = int(period_counts.idxmax())
    largest_period = {**periods[largest_index], "count": int(period_counts.max())}
    anchors = [pd.Timestamp(p["date"]) for p in periods]
    spacing = [int((anchors[i + 1] - anchors[i]).days) for i in range(len(anchors) - 1)]

    reconciliation = reconcile(frame, data, periods, stats, largest_period)
    applicant_field_hits = find_applicant_fields(list(frame.columns))
    category_counts = data["category"].value_counts()

    summary = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": {
            "file": args.input.name,
            "sheets": sheet_info,
            "rows": total,
            "columns": int(frame.shape[1]),
            "uniqueOpportunityIds": int(frame["OPPORTUNITY ID"].nunique()),
        },
        "coverage": {"firstPeriod": periods[0]["date"], "lastPeriod": periods[-1]["date"],
                     "recordsWithoutDate": int(frame["CREATED AT"].isna().sum())},
        "periods": periods,
        "dateBinning": {
            "distinctCreatedDates": len(periods),
            "spacingDays": spacing,
            "largestPeriod": largest_period,
            **verify_date_binning(frame, anchors),
        },
        "categories": [{"name": name, "count": int(count),
                        "smallSample": bool(count < SMALL_SAMPLE_THRESHOLD)}
                       for name, count in category_counts.items()],
        "locations": [{"name": name, "count": int(count)}
                      for name, count in data["location"].value_counts().items()],
        "smallSampleThreshold": SMALL_SAMPLE_THRESHOLD,
        "scholarship": stats,
        "scholarshipStatus": {k: int(v) for k, v in data["scholarship"].value_counts().items()},
        "scholarshipUnknownDetail": {
            "rawAmountZeroButCurrencyMissing": int(((frame["MICROSCHOLARSHIP"] == 0)
                                                    & frame["microscholarship_usd"].isna()).sum()),
            "rawAmountPositiveButCurrencyMissing": int(((frame["MICROSCHOLARSHIP"] > 0)
                                                        & frame["microscholarship_usd"].isna()).sum()),
            "rawAmountMissing": int(frame["MICROSCHOLARSHIP"].isna().sum()),
        },
        "currencyConversion": {
            currency: {"records": int((frame["CURRENCY TYPE"] == currency).sum()),
                       "usdPerUnitApprox": to_float(
                           (frame.loc[frame["CURRENCY TYPE"] == currency, "microscholarship_usd"]
                            / frame.loc[frame["CURRENCY TYPE"] == currency, "MICROSCHOLARSHIP"]
                            ).replace([np.inf, -np.inf], np.nan).median() * 10000) / 10000}
            for currency in sorted(frame["CURRENCY TYPE"].dropna().unique())
        },
        "fee": {
            "status": {k: int(v) for k, v in data["fee"].value_counts().items()},
            "maxFeeUsd": to_float(pd.to_numeric(frame["fee_usd"], errors="coerce").max()),
        },
        "archived": int(data["archived"].sum()),
        "likelyTestRecords": {
            **test_counts,
            "pctOfTotal": pct(test_counts["flaggedTotal"], total),
            "byPeriod": test_share_by_period(data, periods),
            "byYear": test_share_by_year(data, periods),
        },
        "lastDateToApplyPlaceholders": int((pd.to_datetime(frame["LAST DATE TO APPLY"], errors="coerce")
                                            < "2000-01-01").sum()),
        "durationUnits": {k: int(v) for k, v in frame["DURATION TYPE"].value_counts().items()},
        "outliers": build_outliers(frame, data, periods),
        "columnProfile": profile_columns(frame),
        "applicantFieldScan": {"keywords": APPLICANT_OR_OUTREACH_KEYWORDS, "matchingColumns": applicant_field_hits},
        "transactionReferenceCounts": {
            "NOT STARTED TRANSACTION": int(frame["NOT STARTED TRANSACTION"].notna().sum()),
            "DROPOUT TRANSACTION": int(frame["DROPOUT TRANSACTION"].notna().sum()),
        },
        "reconciliation": reconciliation,
    }

    # Compact per-record output. Keys are documented in "fields".
    records = []
    for row in data.itertuples(index=False):
        records.append({
            "c": row.category,
            "l": row.location,
            "p": None if row.period is None or pd.isna(row.period) else int(row.period),
            "s": row.scholarship,
            "a": to_float(row.amount),
            "f": row.fee,
            "ar": 1 if row.archived else 0,
            "t": 1 if row.likelyTest else 0,
        })
    opportunities = {
        "fields": {
            "c": "Category ('Uncategorized' when blank)",
            "l": f"Delivery mode/location ('{LOCATION_MISSING_LABEL}' when blank)",
            "p": "Creation period index into summary.periods (null when CREATED AT is blank)",
            "s": "Scholarship status: 'offers' (USD > 0), 'zero' (USD = 0), 'unknown' (USD blank)",
            "a": "Scholarship amount in USD rounded to cents (null when unknown)",
            "f": "Fee status: 'free' (fee_usd = 0), 'paid' (> 0), 'unknown' (blank)",
            "ar": "1 when IS ARCHIVED is true",
            "t": "1 when NAME matches the likely-test-record heuristic",
        },
        "records": records,
    }

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "opportunities.json").write_text(json.dumps(opportunities, separators=(",", ":")), encoding="utf-8")
    (OUTPUT_DIR / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")

    # Console report
    print(f"Read {total} records x {frame.shape[1]} columns from '{args.input.name}'.")
    print(f"Creation periods: {len(periods)} ({periods[0]['date']} to {periods[-1]['date']}), "
          f"spacing {min(spacing)}-{max(spacing)} days.")
    print(f"Likely test records: {test_counts['flaggedTotal']} ({summary['likelyTestRecords']['pctOfTotal']}%).")
    print(f"Applicant/outreach columns found: {applicant_field_hits or 'none'}")
    print("\nReconciliation against Week 2 reported figures:")
    mismatches = 0
    for row in reconciliation:
        status = "OK " if row["match"] else "DIFF"
        mismatches += 0 if row["match"] else 1
        print(f"  [{status}] {row['metric']:<36} reported={row['week2Reported']!s:<12} computed={row['computed']}")
    print(f"\n{len(reconciliation) - mismatches}/{len(reconciliation)} figures match.")
    print(f"Wrote {OUTPUT_DIR / 'opportunities.json'} and {OUTPUT_DIR / 'summary.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
