import pandas as pd
import numpy as np
import io
from langchain_ollama import OllamaLLM

llm = OllamaLLM(model="llama3.2")

def business_consultant_analysis(contents: bytes, filename: str) -> dict:
    """AI Business Consultant — full business analysis."""

    try:
        df = pd.read_csv(io.BytesIO(contents))
    except UnicodeDecodeError:
        df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")

    if filename.endswith(".xlsx"):
        df = pd.read_excel(io.BytesIO(contents))

    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    text_cols = df.select_dtypes(include="object").columns.tolist()

    # Build comprehensive data context
    context = {
        "total_records": len(df),
        "columns": list(df.columns),
        "numeric_summary": {},
        "category_performance": {},
        "top_performers": {},
        "bottom_performers": {}
    }

    # Numeric stats
    for col in numeric_cols[:5]:
        context["numeric_summary"][col] = {
            "total": round(float(df[col].sum()), 2),
            "mean": round(float(df[col].mean()), 2),
            "min": round(float(df[col].min()), 2),
            "max": round(float(df[col].max()), 2),
            "std": round(float(df[col].std()), 2)
        }

    # Category performance
    for cat_col in text_cols[:3]:
        if df[cat_col].nunique() <= 15:
            for num_col in numeric_cols[:2]:
                key = f"{cat_col}_vs_{num_col}"
                perf = df.groupby(cat_col)[num_col].sum().sort_values(ascending=False)
                context["category_performance"][key] = perf.to_dict()

                # Top 3 and bottom 3
                context["top_performers"][key] = perf.head(3).to_dict()
                context["bottom_performers"][key] = perf.tail(3).to_dict()

    prompt = f"""You are a world-class senior business consultant with 20+ years experience.
Analyze this business data and provide a COMPREHENSIVE BUSINESS CONSULTATION:

File: {filename}
Total Records: {len(df)}
Data Overview: {context}

Provide a detailed consultation covering ALL of the following:

## 1. EXECUTIVE BUSINESS SUMMARY
Write 3-4 sentences summarizing the overall business performance.

## 2. SWOT ANALYSIS
**Strengths** (3 specific strengths with data evidence)
**Weaknesses** (3 specific weaknesses with data evidence)
**Opportunities** (3 growth opportunities)
**Threats** (2-3 business threats or risks)

## 3. PERFORMANCE SCORECARD
Rate the business on these dimensions (score out of 10 with explanation):
- Revenue Performance: X/10
- Product Mix: X/10
- Growth Potential: X/10
- Risk Level: X/10

## 4. STRATEGIC RECOMMENDATIONS
Provide 5 specific strategic recommendations with:
- Action to take
- Expected impact (quantified)
- Timeline (immediate/short-term/long-term)

## 5. GROWTH ROADMAP
Three phases:
- Phase 1 (0-3 months): Quick wins
- Phase 2 (3-6 months): Growth initiatives
- Phase 3 (6-12 months): Scale and optimize

## 6. KEY PERFORMANCE INDICATORS (KPIs) TO TRACK
List 5 specific KPIs with target values.

Be specific with numbers from the data. Write like a McKinsey consultant."""

    consultation = llm.invoke(prompt)

    return {
        "filename": filename,
        "data_context": context,
        "consultation": consultation
    }