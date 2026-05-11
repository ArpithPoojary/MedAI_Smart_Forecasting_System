from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from collections import defaultdict
import numpy as np

from utils.security import get_current_active_user
from database import get_db
import models

router = APIRouter()

FORECAST_DAYS = 30


# =====================================================
# FORECAST FUNCTION
# =====================================================

def forecast_next_days(values, days=30):

    values = np.array(values[-90:], dtype=float)

    values = values[values >= 0]

    # =================================================
    # EMPTY DATA
    # =================================================

    if len(values) == 0:
        return [10 for _ in range(days)]

    # =================================================
    # SMALL DATA
    # =================================================

    if len(values) < 7:

        avg = max(float(np.mean(values)), 1)

        return [
            round(avg, 2)
            for _ in range(days)
        ]

    # =================================================
    # TREND
    # =================================================

    moving_avg = np.mean(values[-14:])

    x = np.arange(len(values))

    try:

        slope, intercept = np.polyfit(
            x,
            values,
            1
        )

    except Exception:

        slope = 0

    # gentle decline cap
    slope = max(
        slope,
        -(moving_avg * 0.015)
    )

    forecast = []

    for i in range(1, days + 1):

        trend = moving_avg + (slope * i)

        seasonal = (
            np.sin(i / 5)
            * (moving_avg * 0.03)
        )

        value = trend + seasonal

        # realistic lower bound
        minimum_threshold = max(
            moving_avg * 0.35,
            1
        )

        value = max(
            value,
            minimum_threshold
        )

        forecast.append(
            round(value, 2)
        )

    return forecast


# =====================================================
# MAIN API
# =====================================================

@router.get("/insights")
def get_prediction_insights(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):

    try:

        user_id = current_user.id

        rows = db.query(
            models.SalesData
        ).filter(
            models.SalesData.user_id == user_id
        ).order_by(
            models.SalesData.date.asc()
        ).all()

        # =================================================
        # EMPTY STATE
        # =================================================

        if not rows:

            return {

                "summary": {},

                "forecastDays": FORECAST_DAYS,

                "forecast": [],

                "restock": [],

                "expiry": [],

                "overstock": [],

                "fastMoving": [],

                "categoryDemand": [],

                "aiInsights": []
            }

        medicines = defaultdict(list)

        for row in rows:

            medicine = row.medicine_name or "Unknown"

            medicines[medicine].append(row)

        # =================================================
        # VARIABLES
        # =================================================

        restock = []
        expiry = []
        overstock = []
        fast_moving = []

        category_totals = defaultdict(float)

        total_revenue = 0
        high_risk_count = 0

        all_recent_sales = []
        all_future_sales = []

        today = date.today()

        # =================================================
        # PROCESS MEDICINES
        # =================================================

        for medicine_name, items in medicines.items():

            items = sorted(
                items,
                key=lambda x: x.date
            )

            latest = items[-1]

            stock = int(latest.stock or 0)

            price = float(
                getattr(latest, "price", 10)
                or 10
            )

            category = (
                getattr(latest, "category", "Other")
                or "Other"
            )

            sales_values = [

                float(i.sales or 0)

                for i in items
            ]

            # =================================================
            # FORECAST
            # =================================================

            forecast_values = forecast_next_days(
                sales_values,
                FORECAST_DAYS
            )

            predicted_30_days = int(
                sum(forecast_values)
            )

            avg_daily_sales = max(
                np.mean(forecast_values),
                1
            )

            total_revenue += (
                predicted_30_days * price
            )

            category_totals[category] += (
                predicted_30_days
            )

            # =================================================
            # NORMALIZED RECENT TOTAL
            # =================================================

            recent_window = (

                sales_values[-30:]

                if len(sales_values) >= 30

                else sales_values
            )

            recent_total = sum(
                recent_window
            )

            # normalize sparse medicines
            if len(recent_window) < 30:

                recent_total = (

                    recent_total /
                    max(len(recent_window), 1)

                ) * 30

            future_total = sum(
                forecast_values
            )

            # avoid sparse-history skew
            if len(sales_values) >= 14:

                all_recent_sales.append(
                    recent_total
                )

                all_future_sales.append(
                    future_total
                )

            # =================================================
            # STOCK METRICS
            # =================================================

            stock_coverage_days = round(

                stock / max(avg_daily_sales, 1),

                1
            )

            utilization = round(

                (
                    predicted_30_days /
                    max(stock, 1)
                ) * 100,

                1
            )

            excess_stock = max(
                stock - predicted_30_days,
                0
            )

            # =================================================
            # SAFETY BUFFER
            # =================================================

            safety_buffer = avg_daily_sales * 7

            required_stock = int(
                predicted_30_days + safety_buffer
            )

            reorder_qty = max(
                required_stock - stock,
                0
            )

            # =================================================
            # RISK
            # =================================================

            days_left = int(
                stock_coverage_days
            )

            risk = "LOW"

            if days_left <= 5:

                risk = "HIGH"

            elif days_left <= 12:

                risk = "MEDIUM"

            if risk in ("HIGH", "MEDIUM"):

                high_risk_count += 1

            # =================================================
            # TRUE OVERSTOCK LOGIC
            # =================================================

            is_overstock = (

                stock_coverage_days > 45

                and

                utilization < 75

                and

                stock > predicted_30_days
            )

            # =================================================
            # TRUE RESTOCK TRIGGER
            # =================================================

            is_restock = days_left <= 12

            # =================================================
            # MUTUAL EXCLUSION
            # =================================================

            if is_restock:

                restock.append({

                    "medicineName": medicine_name,

                    "stock": stock,

                    "demand": predicted_30_days,

                    "required": reorder_qty,

                    "risk": risk,

                    "forecastDays": FORECAST_DAYS,

                    "daysLeft": days_left
                })

            elif is_overstock:

                if stock_coverage_days > 90:

                    severity = "HIGH"

                elif stock_coverage_days > 60:

                    severity = "MEDIUM"

                else:

                    severity = "LOW"

                overstock.append({

                    "medicineName": medicine_name,

                    "stock": int(stock),

                    "expectedDemand": int(
                        predicted_30_days
                    ),

                    "excess": int(
                        excess_stock
                    ),

                    "coverageDays": round(
                        stock_coverage_days,
                        1
                    ),

                    "utilization": round(
                        utilization,
                        1
                    ),

                    "severity": severity
                })

            # =================================================
            # FAST MOVING
            # =================================================

            if len(sales_values) >= 14:

                previous_avg = np.mean(
                    sales_values[-14:-7]
                )

                current_avg = np.mean(
                    sales_values[-7:]
                )

                if previous_avg > 0:

                    growth = (

                        (
                            current_avg -
                            previous_avg
                        )

                        / previous_avg

                    ) * 100

                    if growth > 5:

                        fast_moving.append({

                            "medicineName": medicine_name,

                            "growth": round(
                                growth,
                                1
                            ),

                            "stock": stock,

                            "demand": predicted_30_days
                        })

            # =================================================
            # EXPIRY ALERTS
            # =================================================

            if latest.expiry_date:

                expiry_days = (
                    latest.expiry_date - today
                ).days

                if expiry_days <= 120:

                    expiry.append({

                        "medicineName": medicine_name,

                        "batch":
                            f"BATCH-{latest.id}",

                        "expiryDate":
                            latest.expiry_date.isoformat(),

                        "daysLeft":
                            max(expiry_days, 0)
                    })

        # =================================================
        # CATEGORY DEMAND
        # =================================================

        category_demand = []

        total_categories = sum(
            category_totals.values()
        )

        for category, value in category_totals.items():

            percentage = (

                (value / total_categories) * 100

                if total_categories > 0 else 0
            )

            category_demand.append({

                "category": category,

                "growth": round(
                    percentage,
                    1
                )
            })

        # =================================================
        # GLOBAL FORECAST CHART
        # =================================================

        daily_totals = defaultdict(float)

        for r in rows:

            daily_totals[r.date] += float(
                r.sales or 0
            )

        sorted_dates = sorted(
            daily_totals.keys()
        )

        all_sales = [

            daily_totals[d]

            for d in sorted_dates
        ]

        future_forecast = forecast_next_days(
            all_sales,
            FORECAST_DAYS
        )

        chart = []

        start_date = today + timedelta(days=1)

        for i in range(FORECAST_DAYS):

            future_date = (
                start_date +
                timedelta(days=i)
            )

            chart.append({

                "date":
                    future_date.strftime("%b %d"),

                "predicted":
                    round(
                        future_forecast[i],
                        2
                    )
            })

        # =================================================
        # GLOBAL DEMAND GROWTH
        # =================================================

        total_recent_sales = sum(
            all_recent_sales
        )

        total_future_sales = sum(
            all_future_sales
        )

        # insufficient history
        if total_recent_sales == 0:

            predicted_growth = 0.0

        else:

            raw_growth = (

                (
                    total_future_sales -
                    total_recent_sales
                )

                / max(total_recent_sales, 1)

            ) * 100

            predicted_growth = round(
                raw_growth,
                1
            )

            predicted_growth = max(

                min(predicted_growth, 150),

                -80
            )

        # =================================================
        # AI INSIGHTS
        # =================================================

        ai_insights = [

            {
                "title": "Demand Forecast",

                "message":

                    (
                        f"Overall medicine demand expected to {'grow' if predicted_growth >= 0 else 'decline'} by {abs(predicted_growth)}% over next {FORECAST_DAYS} days"

                        if total_recent_sales > 0

                        else

                        "Not enough history to compute demand trend"
                    )
            },

            {
                "title": "Stock Alert",

                "message":
                    f"{high_risk_count} medicines may go out of stock soon"
            },

            {
                "title": "Expiry Alert",

                "message":
                    f"{len(expiry)} medicines expiring within 120 days"
            },

            {
                "title": "Overstock Detection",

                "message":
                    f"{len(overstock)} medicines detected with excess inventory"
            },

            {
                "title": "Inventory Optimization",

                "message":
                    f"Inventory optimization can save ₹{int(total_revenue * 0.08):,}"
            }
        ]

        # =================================================
        # SUMMARY
        # =================================================

        summary = {

            "predictedDemand":
                predicted_growth,

            "revenue":
                f"₹{round(total_revenue / 100000, 2)} L",

            "highRisk":
                high_risk_count,

            "updatedAt":
                datetime.now().strftime("%I:%M %p")
        }

        # =================================================
        # RESPONSE
        # =================================================

        return {

            "summary": summary,

            "forecastDays": FORECAST_DAYS,

            "forecast": chart,

            "restock":
                sorted(
                    restock,
                    key=lambda x: x["daysLeft"]
                )[:20],

            "expiry":
                sorted(
                    expiry,
                    key=lambda x: x["daysLeft"]
                )[:20],

            "overstock":
                sorted(
                    overstock,
                    key=lambda x: x["coverageDays"],
                    reverse=True
                )[:20],

            "fastMoving":
                sorted(
                    fast_moving,
                    key=lambda x: x["growth"],
                    reverse=True
                )[:20],

            "categoryDemand":
                sorted(
                    category_demand,
                    key=lambda x: x["growth"],
                    reverse=True
                )[:20],

            "aiInsights":
                ai_insights
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )