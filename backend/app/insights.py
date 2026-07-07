import pandas as pd
import io
from langchain_ollama import OllamaLLM

llm = OllamaLLM(model="llama3.2")

def generate_insights(contents: bytes, filename: str) -> dict:
    """Generate executive business insights from data."""

    # Read file
    if filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))

    # Build data context
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    text_cols = df.select_dtypes(include="object").columns.tolist()

    stats = {}
    for col in numeric_cols:
        stats[col] = {
            "min": round(float(df[col].min()), 2),
            "max": round(float(df[col].max()), 2),
            "mean": round(float(df[col].mean()), 2),
            "sum": round(float(df[col].sum()), 2)
        }

    # Category breakdown
    category_breakdown = {}
    for col in text_cols:
        if df[col].nunique() < 10:
            for num_col in numeric_cols:
                breakdown = df.groupby(col)[num_col].sum().to_dict()
                category_breakdown[f"{col}_vs_{num_col}"] = {
                    str(k): round(float(v), 2)
                    for k, v in breakdown.items()
                }

    # Build prompt for LLM
    prompt = f"""You are a senior business analyst. Analyze this business data and provide:
1. Executive Summary (2-3 sentences)
2. Top 3 Key Insights (business-friendly language)
3. Top 3 Actionable Recommendations

Data Overview:
- File: {filename}
- Rows: {len(df)}
- Columns: {list(df.columns)}

Statistics:
{stats}

Category Breakdown:
{category_breakdown}

Write in plain business English. Be specific with numbers. Focus on business impact.
Keep each point concise (1-2 sentences max).
"""

    response = llm.invoke(prompt)

    return {
        "executive_summary": response,
        "stats": stats,
        "category_breakdown": category_breakdown
    }