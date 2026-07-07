import pandas as pd
import io

def generate_summary(contents: bytes, filename: str) -> dict:
    """Auto-generate a comprehensive data summary."""
    
    # Read file
    if filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))

    summary = {}

    # Basic info
    summary["filename"] = filename
    summary["rows"] = len(df)
    summary["columns"] = len(df.columns)
    summary["column_names"] = list(df.columns)

    # Missing values
    missing = df.isnull().sum()
    summary["missing_values"] = {
        col: int(missing[col]) 
        for col in df.columns 
        if missing[col] > 0
    }
    summary["total_missing"] = int(missing.sum())

    # Data quality score (0-100)
    total_cells = len(df) * len(df.columns)
    missing_cells = summary["total_missing"]
    summary["quality_score"] = round(
        ((total_cells - missing_cells) / total_cells) * 100, 1
    ) if total_cells > 0 else 0

    # Column analysis
    column_info = {}
    for col in df.columns:
        col_data = {}
        col_data["type"] = str(df[col].dtype)
        col_data["missing"] = int(df[col].isnull().sum())
        col_data["unique_values"] = int(df[col].nunique())

        if pd.api.types.is_numeric_dtype(df[col]):
            col_data["min"] = round(float(df[col].min()), 2)
            col_data["max"] = round(float(df[col].max()), 2)
            col_data["mean"] = round(float(df[col].mean()), 2)
            col_data["median"] = round(float(df[col].median()), 2)
        else:
            top_values = df[col].value_counts().head(3)
            col_data["top_values"] = {
                str(k): int(v) 
                for k, v in top_values.items()
            }

        column_info[col] = col_data

    summary["column_info"] = column_info

    # Quick insights
    insights = []
    if summary["total_missing"] == 0:
        insights.append("✅ No missing values — clean dataset!")
    else:
        insights.append(f"⚠️ {summary['total_missing']} missing values detected")

    if summary["rows"] > 1000:
        insights.append(f"📊 Large dataset with {summary['rows']:,} rows")
    else:
        insights.append(f"📊 Dataset has {summary['rows']} rows")

    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    if numeric_cols:
        insights.append(f"🔢 {len(numeric_cols)} numeric columns: {', '.join(numeric_cols)}")

    summary["insights"] = insights

    return summary