import pandas as pd
import numpy as np
import io
from langchain_ollama import OllamaLLM

llm = OllamaLLM(model="llama3.2")

INDUSTRY_KEYWORDS = {
    "retail": ["product", "sales", "inventory", "price", "category", "store", "revenue", "discount", "customer", "purchase"],
    "finance": ["loan", "interest", "payment", "income", "debt", "credit", "balance", "rate", "amount", "installment"],
    "healthcare": ["patient", "diagnosis", "treatment", "hospital", "doctor", "medicine", "health", "disease", "age", "gender"],
    "hr": ["employee", "salary", "department", "hire", "attrition", "performance", "manager", "tenure", "leave", "bonus"],
    "marketing": ["campaign", "clicks", "impressions", "conversion", "ctr", "cpc", "roas", "channel", "spend", "leads"],
    "ecommerce": ["order", "cart", "shipping", "return", "rating", "review", "seller", "buyer", "delivery", "product"],
    "manufacturing": ["production", "units", "defect", "quality", "machine", "output", "efficiency", "downtime", "shift", "batch"],
}

def detect_industry(df):
    columns_lower = " ".join([col.lower() for col in df.columns])
    scores = {}
    for industry, keywords in INDUSTRY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in columns_lower)
        scores[industry] = score
    best_industry = max(scores, key=scores.get)
    return best_industry if scores[best_industry] > 0 else "general"

def generate_industry_intelligence(contents, filename):
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except UnicodeDecodeError:
        df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")

    if filename.endswith(".xlsx"):
        df = pd.read_excel(io.BytesIO(contents))

    industry = detect_industry(df)
    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    text_cols = df.select_dtypes(include="object").columns.tolist()

    stats = {}
    for col in numeric_cols[:5]:
        stats[col] = {
            "total": round(float(df[col].sum()), 2),
            "mean": round(float(df[col].mean()), 2),
            "min": round(float(df[col].min()), 2),
            "max": round(float(df[col].max()), 2)
        }

    category_data = {}
    for col in text_cols[:3]:
        if df[col].nunique() <= 15:
            category_data[col] = df[col].value_counts().head(5).to_dict()

    prompt = f"""You are a world-class {industry.upper()} industry analyst.

Analyze this {industry} business data:
File: {filename}, Records: {len(df)}, Columns: {list(df.columns)}
Statistics: {stats}
Categories: {category_data}

Provide a detailed {industry.upper()} industry analysis:

## INDUSTRY CONTEXT
Explain what this data represents in the {industry} industry.

## INDUSTRY BENCHMARKS
Compare key metrics against {industry} industry standards.

## INDUSTRY-SPECIFIC INSIGHTS
5 specific insights relevant to {industry}.

## INDUSTRY RISKS
3 specific risks for this {industry} business.

## GROWTH STRATEGIES
5 growth strategies specific to {industry}.

## INDUSTRY KPIs
5 critical KPIs with current values and benchmarks.

Be specific with numbers. Use {industry} terminology."""

    intelligence = llm.invoke(prompt)

    return {
        "filename": filename,
        "detected_industry": industry,
        "industry_display": industry.upper(),
        "records_analyzed": len(df),
        "intelligence": intelligence,
        "data_stats": stats,
        "category_data": category_data
    }