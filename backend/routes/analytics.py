from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from collections import defaultdict

from database import get_db
from models import SalesData
from utils.security import get_current_active_user

router = APIRouter()


# =====================================================
# DATE RANGE HELPER
# =====================================================

def get_date_range(type: str, value: str):
    """
    Returns (start_date, end_date) as exclusive upper bound.
    e.g. month 2026-04 → (2026-04-01, 2026-05-01)
    """

    if type == "month":

        year, month = map(int, value.split("-"))

        start = date(year, month, 1)

        if month == 12:
            end = date(year + 1, 1, 1)
        else:
            end = date(year, month + 1, 1)

        return start, end

    elif type == "year":

        year = int(value)

        return date(year, 1, 1), date(year + 1, 1, 1)

    elif type == "day":

        d = date.fromisoformat(value)

        return d, d + timedelta(days=1)

    # fallback — return today
    today = date.today()
    return today, today + timedelta(days=1)


# =====================================================
# PREVIOUS PERIOD HELPER
# =====================================================

def get_previous_range(type: str, value: str):
    """
    Returns date range for the period immediately before the given one.
    Used for growth % comparison.
    """

    if type == "month":

        year, month = map(int, value.split("-"))

        if month == 1:
            prev_value = f"{year - 1}-12"
        else:
            prev_value = f"{year}-{str(month - 1).zfill(2)}"

        return get_date_range("month", prev_value)

    elif type == "year":

        prev_value = str(int(value) - 1)

        return get_date_range("year", prev_value)

    elif type == "day":

        d = date.fromisoformat(value)
        prev = d - timedelta(days=1)

        return get_date_range("day", str(prev))

    today = date.today()
    yesterday = today - timedelta(days=1)
    return get_date_range("day", str(yesterday))


# =====================================================
# FILTER HELPER
# =====================================================

def apply_date_filter(query, start: date, end: date):
    """
    Applies start <= date < end filter (exclusive upper bound).
    """
    return query.filter(
        SalesData.date >= start,
        SalesData.date < end
    )


# =====================================================
# SUMMARY
# =====================================================

@router.get("/summary")
def get_summary(
    type: str,
    value: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):

    start, end = get_date_range(type, value)

    prev_start, prev_end = get_previous_range(type, value)

    # =================================================
    # CURRENT PERIOD
    # =================================================

    current_rows = apply_date_filter(
        db.query(SalesData).filter(SalesData.user_id == user.id),
        start,
        end
    ).all()

    total_revenue = sum(
        (r.sales or 0) * (r.price or 0)
        for r in current_rows
    )

    total_stock_sold = sum(
        r.sales or 0
        for r in current_rows
    )

    # =================================================
    # PREVIOUS PERIOD (for real growth %)
    # =================================================

    prev_rows = apply_date_filter(
        db.query(SalesData).filter(SalesData.user_id == user.id),
        prev_start,
        prev_end
    ).all()

    prev_revenue = sum(
        (r.sales or 0) * (r.price or 0)
        for r in prev_rows
    )

    prev_stock_sold = sum(
        r.sales or 0
        for r in prev_rows
    )

    # =================================================
    # REAL GROWTH %
    # =================================================

    if prev_revenue > 0:
        revenue_change = round(
            ((total_revenue - prev_revenue) / prev_revenue) * 100,
            1
        )
    else:
        revenue_change = 0.0

    if prev_stock_sold > 0:
        stock_change = round(
            ((total_stock_sold - prev_stock_sold) / prev_stock_sold) * 100,
            1
        )
    else:
        stock_change = 0.0

    return {
        "totalRevenue": float(total_revenue),
        "totalRevenueChange": revenue_change,
        "totalStockSold": float(total_stock_sold),
        "totalStockSoldChange": stock_change
    }


# =====================================================
# TREND
# =====================================================

@router.get("/trend")
def get_trend(
    type: str,
    value: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):

    start, end = get_date_range(type, value)

    rows = apply_date_filter(
        db.query(SalesData).filter(SalesData.user_id == user.id),
        start,
        end
    ).all()

    # =================================================
    # YEAR → aggregate by month
    # =================================================

    if type == "year":

        months = {
            i: {"revenue": 0.0, "stockSold": 0.0}
            for i in range(1, 13)
        }

        for r in rows:
            if r.date:
                m = r.date.month
                months[m]["revenue"] += (r.sales or 0) * (r.price or 0)
                months[m]["stockSold"] += r.sales or 0

        month_names = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ]

        return [
            {
                "date": month_names[i - 1],
                "revenue": round(months[i]["revenue"], 2),
                "stockSold": round(months[i]["stockSold"], 2)
            }
            for i in range(1, 13)
        ]

    # =================================================
    # MONTH → aggregate by day
    # =================================================

    elif type == "month":

        day_map = defaultdict(lambda: {"revenue": 0.0, "stockSold": 0.0})

        for r in rows:
            if r.date:
                day_map[r.date]["revenue"] += (r.sales or 0) * (r.price or 0)
                day_map[r.date]["stockSold"] += r.sales or 0

        return [
            {
                "date": d.strftime("%d %b"),
                "revenue": round(v["revenue"], 2),
                "stockSold": round(v["stockSold"], 2)
            }
            for d, v in sorted(day_map.items())
        ]

    # =================================================
    # DAY → per-medicine breakdown for selected day
    # A single day has no time axis, so return medicine-level
    # data instead of a misleading single-point line chart.
    # =================================================

    else:

        medicine_map = defaultdict(lambda: {"revenue": 0.0, "stockSold": 0.0})

        for r in rows:
            name = r.medicine_name or "Unknown"
            medicine_map[name]["revenue"] += (r.sales or 0) * (r.price or 0)
            medicine_map[name]["stockSold"] += r.sales or 0

        # Sort by units sold descending, return top 15
        sorted_meds = sorted(
            medicine_map.items(),
            key=lambda x: x[1]["stockSold"],
            reverse=True
        )[:15]

        return [
            {
                "date": name,          # reuse "date" key so chart renders correctly
                "revenue": round(v["revenue"], 2),
                "stockSold": round(v["stockSold"], 2)
            }
            for name, v in sorted_meds
        ]


# =====================================================
# TOP SELLING
# =====================================================

@router.get("/top-selling")
def top_selling(
    type: str,
    value: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):

    start, end = get_date_range(type, value)

    rows = apply_date_filter(
        db.query(
            SalesData.medicine_name,
            func.sum(SalesData.sales).label("units"),
            func.sum(SalesData.sales * SalesData.price).label("revenue")
        ).filter(SalesData.user_id == user.id),
        start,
        end
    ).group_by(
        SalesData.medicine_name
    ).order_by(
        func.sum(SalesData.sales).desc()
    ).limit(20).all()

    return [
        {
            "medicineName": r[0] or "Unknown",
            "unitsSold": float(r[1] or 0),
            "revenue": float(r[2] or 0)
        }
        for r in rows
    ]


# =====================================================
# LEAST SELLING
# =====================================================

@router.get("/least-selling")
def least_selling(
    type: str,
    value: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):

    start, end = get_date_range(type, value)

    rows = apply_date_filter(
        db.query(
            SalesData.medicine_name,
            func.sum(SalesData.sales).label("units"),
            func.sum(SalesData.sales * SalesData.price).label("revenue")
        ).filter(SalesData.user_id == user.id),
        start,
        end
    ).group_by(
        SalesData.medicine_name
    ).order_by(
        func.sum(SalesData.sales).asc()
    ).limit(20).all()

    return [
        {
            "medicineName": r[0] or "Unknown",
            "unitsSold": float(r[1] or 0),
            "revenue": float(r[2] or 0)
        }
        for r in rows
    ]


# =====================================================
# CATEGORY DISTRIBUTION
# =====================================================

@router.get("/category-distribution")
def category_distribution(
    type: str,
    value: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_active_user)
):

    start, end = get_date_range(type, value)

    rows = apply_date_filter(
        db.query(
            SalesData.category,
            func.sum(SalesData.sales).label("units")
        ).filter(SalesData.user_id == user.id),
        start,
        end
    ).group_by(
        SalesData.category
    ).order_by(
        func.sum(SalesData.sales).desc()
    ).all()

    return [
        {
            "category": r[0] or "Unknown",
            "units": float(r[1] or 0)
        }
        for r in rows
    ]