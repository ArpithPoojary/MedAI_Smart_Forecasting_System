from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from database import get_db
import models
from utils.security import get_current_active_user
from services.weather import fetch_weather_api

router = APIRouter()


# =========================================================
# DASHBOARD API
# =========================================================

@router.get("/")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):

    try:

        user_id = current_user.id

        today = datetime.now().date()

        start_month = today.replace(day=1)

        # =====================================================
        # BASE FILTER
        # =====================================================

        base_filter = [

            models.SalesData.user_id == user_id,

            models.SalesData.date >= start_month,

            models.SalesData.date <= today
        ]

        # =====================================================
        # SUMMARY METRICS
        # =====================================================

        total_sales = db.query(

            func.coalesce(
                func.sum(models.SalesData.sales),
                0
            )

        ).filter(*base_filter).scalar()

        total_revenue = db.query(

            func.coalesce(

                func.sum(
                    models.SalesData.sales *
                    models.SalesData.price
                ),

                0
            )

        ).filter(*base_filter).scalar()

        total_stock = db.query(

            func.coalesce(
                func.sum(models.SalesData.stock),
                0
            )

        ).filter(

            models.SalesData.user_id == user_id

        ).scalar()

        average_price = db.query(

            func.coalesce(
                func.avg(models.SalesData.price),
                0
            )

        ).filter(

            models.SalesData.user_id == user_id

        ).scalar()

        inventory_value = float(
            total_stock * average_price
        )

        # =====================================================
        # MONTHLY GROWTH
        # =====================================================

        previous_month_end = (
            start_month - timedelta(days=1)
        )

        previous_month_start = (
            previous_month_end.replace(day=1)
        )

        previous_filter = [

            models.SalesData.user_id == user_id,

            models.SalesData.date >= previous_month_start,

            models.SalesData.date <= previous_month_end
        ]

        previous_revenue = db.query(

            func.coalesce(

                func.sum(
                    models.SalesData.sales *
                    models.SalesData.price
                ),

                0
            )

        ).filter(*previous_filter).scalar()

        if previous_revenue > 0:

            monthly_growth = round(

                (
                    (
                        total_revenue -
                        previous_revenue
                    )

                    / previous_revenue

                ) * 100,

                1
            )

        else:

            monthly_growth = 0

        # =====================================================
        # CATEGORY SALES
        # =====================================================

        category_query = db.query(

            models.SalesData.category,

            func.coalesce(
                func.sum(models.SalesData.sales),
                0
            )

        ).filter(

            *base_filter

        ).group_by(

            models.SalesData.category

        ).all()

        category_sales = []

        category_percentages = []

        total_category_sales = sum(
            item[1] for item in category_query
        ) or 1

        for category, sales in category_query:

            category_name = category or "Unknown"

            category_sales.append({

                "category": category_name,

                "total_sales": int(sales)
            })

            percentage = round(

                (
                    sales /
                    total_category_sales
                ) * 100,

                1
            )

            category_percentages.append({

                "category": category_name,

                "percentage": percentage
            })

        # =====================================================
        # REVENUE TREND (FULL MONTH FIXED)
        # =====================================================

        revenue_query = db.query(

            models.SalesData.date,

            func.coalesce(

                func.sum(
                    models.SalesData.sales *
                    models.SalesData.price
                ),

                0
            )

        ).filter(

            *base_filter

        ).group_by(

            models.SalesData.date

        ).order_by(

            models.SalesData.date.asc()

        ).all()

        # Convert DB result to dictionary
        revenue_map = {

            row[0]: float(row[1] or 0)

            for row in revenue_query
        }

        # Create ALL days of current month
        revenue_trend = []

        current_day = start_month

        while current_day <= today:

            revenue_value = revenue_map.get(
                current_day,
                None
            )

            # Skip completely empty days
            if revenue_value is not None:

                revenue_trend.append({

                    "date":
                        current_day.strftime("%d %b"),

                    "revenue":
                        round(revenue_value, 2)
                })

            current_day += timedelta(days=1)

        # =====================================================
        # WEEKLY TREND
        # =====================================================

        weekly_trend = []

        for i in range(7):

            day = today - timedelta(days=6 - i)

            sales = db.query(

                func.coalesce(
                    func.sum(models.SalesData.sales),
                    0
                )

            ).filter(

                models.SalesData.user_id == user_id,

                models.SalesData.date == day

            ).scalar()

            weekly_trend.append({

                "date":
                    day.strftime("%d %b"),

                "sales":
                    int(sales or 0)
            })

        # =====================================================
        # TOP SELLING
        # =====================================================

        top_query = db.query(

            models.SalesData.medicine_name,

            func.coalesce(
                func.sum(models.SalesData.sales),
                0
            ),

            func.coalesce(

                func.sum(
                    models.SalesData.sales *
                    models.SalesData.price
                ),

                0
            )

        ).filter(

            *base_filter

        ).group_by(

            models.SalesData.medicine_name

        ).order_by(

            func.sum(models.SalesData.sales).desc()

        ).limit(10).all()

        top_selling = []

        for medicine, units, revenue in top_query:

            top_selling.append({

                "medicine_name": medicine,

                "units_sold": int(units or 0),

                "revenue": round(
                    float(revenue or 0),
                    2
                )
            })

        # =====================================================
        # LOW STOCK MEDICINES
        # =====================================================

        low_stock_query = db.query(

            models.SalesData.medicine_name,

            func.min(models.SalesData.stock),

            func.max(models.SalesData.reorder_level)

        ).filter(

            models.SalesData.user_id == user_id,

            models.SalesData.stock <=
            models.SalesData.reorder_level

        ).group_by(

            models.SalesData.medicine_name

        ).order_by(

            func.min(models.SalesData.stock).asc()

        ).limit(10).all()

        low_stock_medicines = []

        for medicine, stock, reorder_level in low_stock_query:

            stock = int(stock or 0)

            reorder_level = int(reorder_level or 0)

            if stock <= reorder_level * 0.5:

                status = "Critical"

            elif stock <= reorder_level:

                status = "Low"

            else:

                status = "Stable"

            low_stock_medicines.append({

                "medicine_name": medicine,

                "current_stock": stock,

                "reorder_level": reorder_level,

                "status": status
            })

        # =====================================================
        # EXPIRING SOON
        # =====================================================

        next_60_days = today + timedelta(days=60)

        expiring_query = db.query(

            models.SalesData.medicine_name,

            models.SalesData.expiry_date

        ).filter(

            models.SalesData.user_id == user_id,

            models.SalesData.expiry_date != None,

            models.SalesData.expiry_date >= today,

            models.SalesData.expiry_date <= next_60_days

        ).limit(10).all()

        expiring_soon = []

        for medicine, expiry_date in expiring_query:

            expiring_soon.append({

                "medicine_name": medicine,

                "expiry_date":
                    expiry_date.strftime("%d %b %Y")
            })

        # =====================================================
        # INVENTORY HEALTH
        # =====================================================

        total_inventory_items = db.query(

            func.count(models.SalesData.id)

        ).filter(

            models.SalesData.user_id == user_id

        ).scalar()

        healthy_inventory_items = db.query(

            func.count(models.SalesData.id)

        ).filter(

            models.SalesData.user_id == user_id,

            models.SalesData.stock >
            models.SalesData.reorder_level

        ).scalar()

        if total_inventory_items > 0:

            inventory_health = round(

                (
                    healthy_inventory_items /
                    total_inventory_items
                ) * 100,

                1
            )

        else:

            inventory_health = 100

        # =====================================================
        # REAL WEATHER
        # =====================================================

        weather = fetch_weather_api()

        weather_prediction = []

        temperature = weather["temperature"]

        if temperature < 20:

            weather_prediction.append({

                "condition": "Cold Weather",

                "impact":
                    "Cold & fever medicine demand may increase."
            })

        elif temperature > 32:

            weather_prediction.append({

                "condition": "Hot Weather",

                "impact":
                    "Hydration & fever medicine demand may increase."
            })

        else:

            weather_prediction.append({

                "condition": "Normal Weather",

                "impact":
                    "Stable medicine demand expected."
            })

        # =====================================================
        # ALERTS
        # =====================================================

        alerts = []

        if monthly_growth > 10:

            alerts.append({

                "type": "success",

                "message":
                    "Revenue increased significantly this month."
            })

        if len(low_stock_medicines) > 0:

            alerts.append({

                "type": "warning",

                "message":
                    f"{len(low_stock_medicines)} medicines are low on stock."
            })

        if inventory_health < 70:

            alerts.append({

                "type": "danger",

                "message":
                    "Inventory health is below optimal level."
            })

        # =====================================================
        # SMART SUMMARY
        # =====================================================

        smart_summary = []

        if category_sales:

            top_category = max(

                category_sales,

                key=lambda x: x["total_sales"]
            )

            smart_summary.append(

                f"{top_category['category']} category contributed highest sales this month."
            )

        smart_summary.append(
            f"Monthly revenue growth is {monthly_growth}%."
        )

        smart_summary.append(
            f"{len(low_stock_medicines)} medicines require stock attention."
        )

        smart_summary.append(
            f"Inventory health is {inventory_health}%."
        )

        # =====================================================
        # FINAL RESPONSE
        # =====================================================

        return {

            "summary": {

                "total_sales":
                    int(total_sales),

                "total_revenue":
                    round(float(total_revenue), 2),

                "total_stock":
                    int(total_stock),

                "inventory_value":
                    round(inventory_value, 2),

                "inventory_health":
                    inventory_health,

                "monthly_growth":
                    monthly_growth,

                "low_stock_count":
                    len(low_stock_medicines),

                "expiring_count":
                    len(expiring_soon)
            },

            "category_sales":
                category_sales,

            "category_percentages":
                category_percentages,

            "weekly_trend":
                weekly_trend,

            "revenue_trend":
                revenue_trend,

            "top_selling":
                top_selling,

            "low_stock_medicines":
                low_stock_medicines,

            "expiring_soon":
                expiring_soon,

            "weather":
                weather,

            "weather_prediction":
                weather_prediction,

            "alerts":
                alerts,

            "smart_summary":
                smart_summary
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )