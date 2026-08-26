import pandas as pd
import numpy as np
import io
from backend.app.groq_client import chat as groq_chat




def generate_dashboard(contents: bytes, filename: str) -> dict:
    if filename.endswith(".csv"):
        try:
            df = pd.read_csv(io.BytesIO(contents))
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")
    else:
        df = pd.read_excel(io.BytesIO(contents))

    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    text_cols = df.select_dtypes(include="object").columns.tolist()

    result = {}

    # KPI Cards
    kpis = []
    for col in numeric_cols[:4]:
        kpis.append({
            "label": f"Total {col.title()}",
            "value": f"{df[col].sum():,.0f}",
            "sublabel": f"Avg: {df[col].mean():,.1f}"
        })
    result["kpis"] = kpis

    # Bar Chart
    if text_cols and numeric_cols:
        cat_col = text_cols[0]
        num_col = numeric_cols[0]
        if df[cat_col].nunique() <= 15:
            bar_data = df.groupby(cat_col)[num_col].sum().reset_index()
            bar_data = bar_data.sort_values(num_col, ascending=False).head(10)
            result["bar_data"] = [
                {"name": str(row[cat_col]), "value": round(float(row[num_col]), 2)}
                for _, row in bar_data.iterrows()
            ]
            result["bar_title"] = f"{num_col.title()} by {cat_col.title()}"

    # Pie Chart
    if text_cols and numeric_cols:
        cat_col = text_cols[0]
        num_col = numeric_cols[0]
        if df[cat_col].nunique() <= 8:
            pie_data = df.groupby(cat_col)[num_col].sum().reset_index()
            result["pie_data"] = [
                {"name": str(row[cat_col]), "value": round(float(row[num_col]), 2)}
                for _, row in pie_data.iterrows()
            ]
            result["pie_title"] = f"{num_col.title()} Distribution"

    # Line Chart
    if numeric_cols:
        num_col = numeric_cols[0]
        if text_cols:
            x_col = text_cols[1] if len(text_cols) > 1 else text_cols[0]
            if df[x_col].nunique() <= 20:
                line_data = df.groupby(x_col)[num_col].sum().reset_index()
                result["line_data"] = [
                    {"name": str(row[x_col]), "value": round(float(row[num_col]), 2)}
                    for _, row in line_data.iterrows()
                ]
                result["line_title"] = f"{num_col.title()} Trend by {x_col.title()}"
        else:
            result["line_data"] = [
                {"name": str(i+1), "value": round(float(v), 2)}
                for i, v in enumerate(df[num_col].values[:20])
            ]
            result["line_title"] = f"{num_col.title()} Trend"

    # Scatter Plot
    if len(numeric_cols) >= 1:
        num_col = numeric_cols[0]
        result["scatter_data"] = [
            {"x": i+1, "y": round(float(v), 2)}
            for i, v in enumerate(df[num_col].values[:50])
        ]
        result["scatter_title"] = f"{num_col.title()} Distribution Scatter"

    # Heatmap
    if text_cols and len(numeric_cols) >= 1:
        cat_col = text_cols[0]
        if df[cat_col].nunique() <= 10:
            heatmap_cols = numeric_cols[:4]
            heatmap_data = []
            for cat_val in df[cat_col].unique():
                subset = df[df[cat_col] == cat_val]
                values = [round(float(subset[col].sum()), 2) for col in heatmap_cols]
                heatmap_data.append({
                    "name": str(cat_val),
                    "values": values
                })
            result["heatmap_data"] = heatmap_data
            result["heatmap_cols"] = [col.title() for col in heatmap_cols]
            result["heatmap_title"] = f"Performance Heatmap by {cat_col.title()}"

    # AI Insight
    summary = {col: round(float(df[col].sum()), 2) for col in numeric_cols[:3]}
    prompt = f"""Analyze this business data and give ONE powerful insight in 2 sentences:
File: {filename}, Rows: {len(df)}
Key metrics: {summary}
Category breakdown: {dict(df[text_cols[0]].value_counts().head(3)) if text_cols else 'N/A'}
Be specific with numbers. Focus on the most important finding."""

    result["ai_insight"] = groq_chat(prompt)

    return result