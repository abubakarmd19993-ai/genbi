import pandas as pd
import numpy as np
import io
from langchain_ollama import OllamaLLM

llm = OllamaLLM(model="llama3.2:1b")


def analyze_data_quality(contents: bytes, filename: str) -> dict:
    """Comprehensive AI data cleaning and quality analysis."""

    if filename.endswith(".csv"):
        try:
            df = pd.read_csv(io.BytesIO(contents))
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")
    else:
        df = pd.read_excel(io.BytesIO(contents))

    issues = []
    suggestions = []
    cleaned_stats = {}

    # 1. Missing Values Detection
    missing = df.isnull().sum()
    missing_pct = (missing / len(df) * 100).round(2)
    missing_cols = {col: {"count": int(missing[col]), "percentage": float(missing_pct[col])}
                   for col in df.columns if missing[col] > 0}

    if missing_cols:
        for col, stats in missing_cols.items():
            issues.append(f"⚠️ '{col}' has {stats['count']} missing values ({stats['percentage']}%)")
            if stats['percentage'] < 5:
                suggestions.append(f"✅ Fill '{col}' missing values with median/mode (only {stats['percentage']}% missing)")
            elif stats['percentage'] < 30:
                suggestions.append(f"🔄 Fill '{col}' missing values using forward fill or interpolation")
            else:
                suggestions.append(f"⚠️ Consider dropping '{col}' column ({stats['percentage']}% missing is too high)")

    # 2. Duplicate Detection
    duplicate_count = df.duplicated().sum()
    if duplicate_count > 0:
        issues.append(f"🔄 {duplicate_count} duplicate rows detected")
        suggestions.append(f"✅ Remove {duplicate_count} duplicate rows to improve data quality")

    # 3. Outlier Detection (IQR method)
    outlier_info = {}
    numeric_cols = df.select_dtypes(include=np.number).columns
    for col in numeric_cols:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR
        outliers = df[(df[col] < lower) | (df[col] > upper)][col]
        if len(outliers) > 0:
            outlier_info[col] = {
                "count": len(outliers),
                "lower_bound": round(float(lower), 2),
                "upper_bound": round(float(upper), 2),
                "outlier_values": outliers.head(3).tolist()
            }
            issues.append(f"📊 '{col}' has {len(outliers)} outliers (outside {round(float(lower),2)} - {round(float(upper),2)})")
            suggestions.append(f"🔍 Investigate outliers in '{col}' — cap at bounds or remove if errors")

    # 4. Data Type Issues
    for col in df.columns:
        if df[col].dtype == object:
            try:
                pd.to_numeric(df[col])
                issues.append(f"🔢 '{col}' contains numbers stored as text")
                suggestions.append(f"✅ Convert '{col}' to numeric type")
            except:
                pass

    # 5. Calculate overall quality score
    total_cells = len(df) * len(df.columns)
    issues_count = sum(missing.values) + duplicate_count
    quality_score = max(0, round((1 - issues_count / total_cells) * 100, 1))

    # 6. AI Summary
    prompt = f"""You are a data quality expert. Analyze these data issues and provide a brief professional summary:

File: {filename}
Rows: {len(df)}, Columns: {len(df.columns)}
Missing Values: {dict(missing_cols)}
Duplicates: {duplicate_count}
Outliers: {outlier_info}
Quality Score: {quality_score}%

Provide:
1. One sentence overall assessment
2. Top 3 most critical issues to fix
3. Expected improvement after cleaning

Keep it brief and actionable. Use business language."""

    ai_summary = llm.invoke(prompt)

    return {
        "filename": filename,
        "rows": len(df),
        "columns": len(df.columns),
        "quality_score": quality_score,
        "missing_values": missing_cols,
        "duplicate_count": int(duplicate_count),
        "outliers": outlier_info,
        "issues": issues,
        "suggestions": suggestions,
        "ai_summary": ai_summary
    }