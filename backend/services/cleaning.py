import pandas as pd


def clean_data(df: pd.DataFrame) -> pd.DataFrame:

    try:

        # =====================================================
        # STANDARDIZE COLUMN NAMES
        # =====================================================

        df.columns = (
            df.columns
            .str.strip()
            .str.lower()
            .str.replace(" ", "_")
        )

        # =====================================================
        # COLUMN MAPPING
        # =====================================================

        column_mapping = {

            # Medicine
            "product_name": "medicine_name",
            "medicine": "medicine_name",

            # Sales
            "quantity_sold": "sales",
            "units_sold": "sales",
            "qty": "sales",

            # Pricing
            "unit_price": "price",
            "cost": "price",

            # Stock
            "current_stock": "stock",
            "inventory": "stock",
        }

        df = df.rename(columns=column_mapping)

        # =====================================================
        # REQUIRED COLUMNS
        # =====================================================

        required_cols = [
            "date",
            "medicine_name",
            "category",
            "sales"
        ]

        missing = [
            col for col in required_cols
            if col not in df.columns
        ]

        if missing:
            raise ValueError(
                f"Missing required columns: {missing}"
            )

        # =====================================================
        # DATE CLEANING (FIXED)
        # =====================================================

        # 🔥 Flexible parsing
        # Prevents Apr ↔ Dec conversion bug

        df["date"] = pd.to_datetime(
            df["date"],
            errors="coerce"
        )

        # Remove invalid dates
        df = df.dropna(subset=["date"])

        if df.empty:
            raise ValueError(
                "No valid dates found in dataset"
            )

        # =====================================================
        # DAY OF WEEK
        # =====================================================

        df["day_of_week"] = (
            df["date"].dt.dayofweek
        )

        # =====================================================
        # EXPIRY DATE
        # =====================================================

        if "expiry_date" in df.columns:

            df["expiry_date"] = pd.to_datetime(
                df["expiry_date"],
                errors="coerce"
            )

        else:

            df["expiry_date"] = pd.NaT

        # =====================================================
        # SAFE NUMERIC CONVERSION
        # =====================================================

        def safe_numeric(column, default):

            if column in df.columns:

                return pd.to_numeric(
                    df[column],
                    errors="coerce"
                )

            return pd.Series(
                default,
                index=df.index
            )

        # =====================================================
        # NUMERIC FIELDS
        # =====================================================

        df["sales"] = safe_numeric(
            "sales",
            0
        )

        df["price"] = safe_numeric(
            "price",
            10
        )

        df["stock"] = safe_numeric(
            "stock",
            100
        )

        df["reorder_level"] = safe_numeric(
            "reorder_level",
            50
        )

        df["temperature"] = safe_numeric(
            "temperature",
            28
        )

        df["rainfall"] = safe_numeric(
            "rainfall",
            0
        )

        # =====================================================
        # REMOVE INVALID SALES
        # =====================================================

        df = df.dropna(subset=["sales"])

        # =====================================================
        # FILL TEXT FIELDS
        # =====================================================

        df["medicine_name"] = (
            df["medicine_name"]
            .fillna("Unknown")
            .astype(str)
            .str.strip()
        )

        df["category"] = (
            df["category"]
            .fillna("Unknown")
            .astype(str)
            .str.strip()
        )

        # =====================================================
        # FILL NUMERIC VALUES
        # =====================================================

        numeric_cols = [
            "sales",
            "price",
            "stock",
            "reorder_level",
            "temperature",
            "rainfall"
        ]

        for col in numeric_cols:

            median_value = (
                df[col].median()
                if not df[col].dropna().empty
                else 0
            )

            df[col] = df[col].fillna(
                median_value
            )

        # =====================================================
        # REMOVE NEGATIVE VALUES
        # =====================================================

        df = df[
            (df["sales"] >= 0) &
            (df["price"] >= 0) &
            (df["stock"] >= 0)
        ]

        # =====================================================
        # CONVERT TO PYTHON DATE
        # =====================================================

        df["date"] = df["date"].dt.date

        df["expiry_date"] = (
            df["expiry_date"].dt.date
        )

        # =====================================================
        # REMOVE DUPLICATES
        # =====================================================

        df = df.drop_duplicates(
            subset=[
                "medicine_name",
                "date"
            ],
            keep="last"
        )

        # =====================================================
        # FINAL STRUCTURE
        # =====================================================

        expected_cols = [

            "date",
            "medicine_name",
            "category",
            "sales",
            "price",
            "stock",
            "reorder_level",
            "expiry_date",
            "temperature",
            "rainfall",
            "day_of_week"
        ]

        for col in expected_cols:

            if col not in df.columns:
                df[col] = None

        df = df[expected_cols]

        # =====================================================
        # SORT
        # =====================================================

        df = df.sort_values(
            by="date"
        ).reset_index(drop=True)

        # =====================================================
        # EMPTY CHECK
        # =====================================================

        if df.empty:

            raise ValueError(
                "No valid data after cleaning"
            )

        print(
            f"✅ Cleaned dataset: {len(df)} rows"
        )

        print(
            f"📅 Date Range: "
            f"{df['date'].min()} "
            f"to "
            f"{df['date'].max()}"
        )

        return df

    except Exception as e:

        raise ValueError(
            f"Data cleaning failed: {str(e)}"
        )