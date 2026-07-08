import pandas as pd
import io
from langchain_ollama import OllamaLLM

llm = OllamaLLM(model="llama3.2")

def generate_recommendations(contents: bytes, filename: str) -> dict:
    """Generate AI-powered business recommendations."""

    if filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))

    # Build data context
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    text_cols = df.select_dtypes(include="object").columns.tolist()

    # Category performance
    category_stats = {}
    for col in text_cols:
        if df[col].nunique() < 10:
            for num_col in numeric_cols:
                stats = df.groupby(col)[num_col].agg(["sum", "mean", "count"])
                category_stats[f"{col}_performance"] = stats.to_dict()

    # Top and bottom performers
    top_bottom = {}
    for col in text_cols:
        if df[col].nunique() < 20:
            for num_col in numeric_cols:
                sorted_data = df.groupby(col)[num_col].sum().sort_values(ascending=False)
                top_bottom[f"top_{col}_by_{num_col}"] = sorted_data.head(3).to_dict()
                top_bottom[f"bottom_{col}_by_{num_col}"] = sorted_data.tail(3).to_dict()

    prompt = f"""You are an expert business consultant analyzing company data.

Based on this business data, provide SPECIFIC and ACTIONABLE recommendations:

File: {filename}
Rows: {len(df)}
Columns: {list(df.columns)}

Category Performance:
{category_stats}

Top & Bottom Performers:
{top_bottom}

Provide exactly:
1. TOP PRIORITY ACTIONS (3 specific actions with expected impact)
2. GROWTH OPPORTUNITIES (3 specific opportunities with potential revenue impact)
3. RISK MITIGATION (2 specific risks and how to address them)
4. QUICK WINS (2 things that can be done immediately)

Be specific with numbers and percentages. Focus on business impact.
Write in clear business language. Each point should be 1-2 sentences max.
"""

    response = llm.invoke(prompt)

    return {
        "recommendations": response,
        "category_stats": {
            k: str(v) for k, v in category_stats.items()
        },
        "top_bottom_performers": {
            k: str(v) for k, v in top_bottom.items()
        }
    }