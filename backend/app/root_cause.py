import pandas as pd
import numpy as np
import io
from langchain_ollama import OllamaLLM
from scipy import stats

llm = OllamaLLM(model="llama3.2")

def analyze_root_cause(contents: bytes, filename: str) -> dict:
    """Analyze root causes of trends and anomalies in business data."""

    try:
        df = pd.read_csv(io.BytesIO(contents))
    except UnicodeDecodeError:
        df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")

    if filename.endswith(".xlsx"):
        df = pd.read_excel(io.BytesIO(contents))

    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    text_cols = df.select_dtypes(include="object").columns.tolist()

    findings = []
    correlations = {}
    anomalies = []
    trends = []

    # 1. Correlation Analysis
    if len(numeric_cols) >= 2:
        corr_matrix = df[numeric_cols].corr()
        for i in range(len(numeric_cols)):
            for j in range(i+1, len(numeric_cols)):
                col1 = numeric_cols[i]
                col2 = numeric_cols[j]
                corr_val = corr_matrix.loc[col1, col2]
                if abs(corr_val) > 0.5:
                    strength = "strong" if abs(corr_val) > 0.8 else "moderate"
                    direction = "positive" if corr_val > 0 else "negative"
                    correlations[f"{col1}_vs_{col2}"] = {
                        "correlation": round(float(corr_val), 3),
                        "strength": strength,
                        "direction": direction
                    }
                    findings.append(
                        f"📊 {strength.title()} {direction} correlation ({corr_val:.2f}) "
                        f"between '{col1}' and '{col2}'"
                    )

    # 2. Anomaly Detection per numeric column
    for col in numeric_cols[:4]:
        mean = df[col].mean()
        std = df[col].std()
        if std > 0:
            z_scores = np.abs((df[col] - mean) / std)
            anomaly_rows = df[z_scores > 2.5]
            if len(anomaly_rows) > 0:
                for _, row in anomaly_rows.iterrows():
                    val = row[col]
                    direction = "spike" if val > mean else "drop"
                    pct = abs((val - mean) / mean * 100)
                    anomalies.append({
                        "column": col,
                        "value": round(float(val), 2),
                        "mean": round(float(mean), 2),
                        "deviation_pct": round(float(pct), 1),
                        "type": direction,
                        "context": {c: str(row[c]) for c in text_cols[:3] if c in row}
                    })
                    findings.append(
                        f"⚠️ Anomaly in '{col}': {direction} of {pct:.1f}% "
                        f"(value: {val:,.2f}, avg: {mean:,.2f})"
                    )

    # 3. Trend Analysis
    for col in numeric_cols[:3]:
        values = df[col].dropna().values
        if len(values) >= 3:
            x = np.arange(len(values))
            slope, intercept, r_value, p_value, std_err = stats.linregress(x, values)
            trend_direction = "upward" if slope > 0 else "downward"
            trend_strength = "strong" if abs(r_value) > 0.7 else "weak"
            if abs(r_value) > 0.3:
                trends.append({
                    "column": col,
                    "direction": trend_direction,
                    "strength": trend_strength,
                    "slope": round(float(slope), 4),
                    "r_squared": round(float(r_value**2), 3)
                })
                findings.append(
                    f"📈 {trend_strength.title()} {trend_direction} trend in '{col}' "
                    f"(R²={r_value**2:.3f}, slope={slope:.4f})"
                )

    # 4. Category Performance Analysis
    category_insights = {}
    if text_cols and numeric_cols:
        cat_col = text_cols[0]
        num_col = numeric_cols[0]
        if df[cat_col].nunique() <= 15:
            cat_stats = df.groupby(cat_col)[num_col].agg(["sum", "mean", "std"])
            overall_mean = df[num_col].mean()
            for cat, row in cat_stats.iterrows():
                deviation = ((row["mean"] - overall_mean) / overall_mean * 100
                            if overall_mean != 0 else 0)
                if abs(deviation) > 20:
                    status = "outperformer" if deviation > 0 else "underperformer"
                    category_insights[str(cat)] = {
                        "status": status,
                        "deviation_from_avg": round(float(deviation), 1),
                        "mean": round(float(row["mean"]), 2),
                        "total": round(float(row["sum"]), 2)
                    }
                    findings.append(
                        f"{'🟢' if status == 'outperformer' else '🔴'} "
                        f"'{cat}' is an {status}: "
                        f"{abs(deviation):.1f}% {'above' if deviation > 0 else 'below'} average"
                    )

    # 5. AI Root Cause Analysis
    prompt = f"""You are a senior data scientist performing root cause analysis on business data.

File: {filename}
Records: {len(df)}, Columns: {list(df.columns)}

Statistical Findings:
Correlations: {correlations}
Anomalies detected: {len(anomalies)}
Trends: {trends}
Category insights: {category_insights}

Key findings so far:
{chr(10).join(findings[:10])}

Provide a ROOT CAUSE ANALYSIS with:
1. PRIMARY ROOT CAUSES (top 3 with confidence score 0-100%)
2. CONTRIBUTING FACTORS (3-4 factors)
3. BUSINESS IMPACT (quantified where possible)
4. RECOMMENDED ACTIONS (3 specific actions)

Be analytical, specific, and use the actual data findings above.
Format clearly with headers."""

    ai_analysis = llm.invoke(prompt)

    return {
        "filename": filename,
        "total_findings": len(findings),
        "findings": findings,
        "correlations": correlations,
        "anomalies": anomalies[:5],
        "trends": trends,
        "category_insights": category_insights,
        "ai_root_cause_analysis": ai_analysis
    }