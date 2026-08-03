import pandas as pd
import numpy as np
import io
from langchain_ollama import OllamaLLM

llm = OllamaLLM(model="llama3.2")

def generate_sql(contents: bytes, filename: str, question: str) -> dict:
    """Generate SQL query from natural language question."""

    try:
        df = pd.read_csv(io.BytesIO(contents))
    except UnicodeDecodeError:
        df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")

    if filename.endswith(".xlsx"):
        df = pd.read_excel(io.BytesIO(contents))

    # Get table name from filename
    table_name = filename.replace(".csv", "").replace(".xlsx", "").replace(" ", "_").lower()

    # Get column info
    col_info = []
    for col in df.columns:
        dtype = str(df[col].dtype)
        if "int" in dtype or "float" in dtype:
            sql_type = "NUMERIC"
        elif "datetime" in dtype:
            sql_type = "DATE"
        else:
            sql_type = "TEXT"
        sample = str(df[col].iloc[0]) if len(df) > 0 else "N/A"
        col_info.append(f"  {col} {sql_type} (sample: {sample})")

    schema = f"Table: {table_name}\nColumns:\n" + "\n".join(col_info)

    prompt = f"""You are an expert SQL developer. Generate a SQL query for the following:

DATABASE SCHEMA:
{schema}

QUESTION: {question}

Provide:
1. SQL QUERY (clean, optimized SQL)
2. EXPLANATION (what the query does in plain English)
3. EXPECTED OUTPUT (describe what columns/rows will be returned)
4. ALTERNATIVE QUERY (a different approach if applicable)

Format your response clearly with these exact headers."""

    ai_response = llm.invoke(prompt)

    # Try to execute query using pandas
    executed_result = None
    try:
        # Simple pandas-based query execution
        q = question.lower()
        if "count" in q or "how many" in q:
            executed_result = {"count": len(df)}
        elif "average" in q or "avg" in q or "mean" in q:
            numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
            if numeric_cols:
                executed_result = {col: round(float(df[col].mean()), 2) for col in numeric_cols[:3]}
        elif "total" in q or "sum" in q:
            numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
            if numeric_cols:
                executed_result = {col: round(float(df[col].sum()), 2) for col in numeric_cols[:3]}
        elif "max" in q or "highest" in q or "most" in q:
            numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
            if numeric_cols:
                col = numeric_cols[0]
                idx = df[col].idxmax()
                executed_result = df.loc[idx].to_dict()
        elif "min" in q or "lowest" in q or "least" in q:
            numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
            if numeric_cols:
                col = numeric_cols[0]
                idx = df[col].idxmin()
                executed_result = df.loc[idx].to_dict()
    except:
        pass

    return {
        "filename": filename,
        "table_name": table_name,
        "schema": schema,
        "question": question,
        "ai_response": ai_response,
        "executed_result": executed_result
    }