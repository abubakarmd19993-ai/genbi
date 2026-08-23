import duckdb
import pandas as pd
import io
import os
import json
import math
from datetime import datetime

DUCKDB_PATH = "./genbi_data.duckdb"
MAX_ROWS_RETURNED = 1000
MAX_CONTEXT_CHARS = 3000
TOP_K = 5

# Simple in-memory cache
_cache = {}

def get_cache_key(file_id: str, query: str) -> str:
    return f"{file_id}:{hash(query)}"

def get_cached(file_id: str, query: str):
    key = get_cache_key(file_id, query)
    return _cache.get(key)

def set_cached(file_id: str, query: str, result):
    key = get_cache_key(file_id, query)
    _cache[key] = result

def clean_value(v):
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    return v

def clean_dict(d):
    if isinstance(d, dict):
        return {k: clean_dict(v) for k, v in d.items()}
    elif isinstance(d, list):
        return [clean_dict(i) for i in d]
    else:
        return clean_value(d)

def get_table_name(file_id: str) -> str:
    return f"dataset_{file_id[:16].replace('-', '_')}"

def register_dataset(contents: bytes, filename: str, file_id: str) -> dict:
    """Register CSV/Excel file into DuckDB and return profile."""
    conn = duckdb.connect(DUCKDB_PATH)
    table_name = get_table_name(file_id)

    try:
        # Load data
        if filename.endswith(".csv"):
            try:
                df = pd.read_csv(io.BytesIO(contents))
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")
        else:
            df = pd.read_excel(io.BytesIO(contents))

        # Clean NaN
        import numpy as np
        df = df.replace([np.inf, -np.inf], None)

        # Register in DuckDB
        conn.execute(f"DROP TABLE IF EXISTS {table_name}")
        conn.register("temp_df", df)
        conn.execute(f"CREATE TABLE {table_name} AS SELECT * FROM temp_df")

        # Generate profile
        profile = generate_profile(df, table_name, file_id)

        conn.close()
        return profile

    except Exception as e:
        conn.close()
        raise e

def generate_profile(df: pd.DataFrame, table_name: str, file_id: str) -> dict:
    """Generate compact dataset profile."""
    import numpy as np

    rows, cols = df.shape
    profile = {
        "file_id": file_id,
        "table_name": table_name,
        "rows": rows,
        "columns": cols,
        "column_names": list(df.columns),
        "dtypes": {col: str(df[col].dtype) for col in df.columns},
        "missing_pct": {col: round(df[col].isnull().sum() / rows * 100, 1) for col in df.columns},
        "unique_counts": {col: int(df[col].nunique()) for col in df.columns},
        "numeric_columns": df.select_dtypes(include="number").columns.tolist(),
        "categorical_columns": df.select_dtypes(include="object").columns.tolist(),
        "date_columns": df.select_dtypes(include=["datetime64"]).columns.tolist(),
        "sample": df.head(3).to_dict(orient="records"),
        "created_at": datetime.utcnow().isoformat(),
    }

    # Numeric stats
    numeric_stats = {}
    for col in df.select_dtypes(include="number").columns[:10]:
        try:
            numeric_stats[col] = {
                "mean": round(float(df[col].mean()), 2) if not math.isnan(df[col].mean()) else None,
                "min": round(float(df[col].min()), 2),
                "max": round(float(df[col].max()), 2),
                "sum": round(float(df[col].sum()), 2),
            }
        except Exception:
            pass
    profile["numeric_stats"] = numeric_stats

    # Top categories
    cat_summaries = {}
    for col in df.select_dtypes(include="object").columns[:5]:
        try:
            cat_summaries[col] = df[col].value_counts().head(5).to_dict()
        except Exception:
            pass
    profile["categorical_summaries"] = cat_summaries

    return clean_dict(profile)

def validate_sql(sql: str) -> bool:
    """Only allow SELECT/WITH queries."""
    sql_clean = sql.strip().upper()
    dangerous = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "CREATE", "EXEC", "EXECUTE", "TRUNCATE"]
    if not sql_clean.startswith(("SELECT", "WITH")):
        return False
    for word in dangerous:
        if word in sql_clean:
            return False
    return True

def execute_query(file_id: str, sql: str) -> dict:
    """Execute safe SQL query using DuckDB."""
    # Check cache
    cached = get_cached(file_id, sql)
    if cached:
        return {**cached, "cached": True}

    if not validate_sql(sql):
        return {"error": "Invalid SQL. Only SELECT queries are allowed.", "sql": sql}

    conn = duckdb.connect(DUCKDB_PATH)
    try:
        result_df = conn.execute(sql).fetchdf()
        conn.close()

        # Limit rows returned
        if len(result_df) > MAX_ROWS_RETURNED:
            result_df = result_df.head(MAX_ROWS_RETURNED)

        result = {
            "sql": sql,
            "rows": len(result_df),
            "columns": list(result_df.columns),
            "data": clean_dict(result_df.to_dict(orient="records")),
            "cached": False,
        }

        # Cache result
        set_cached(file_id, sql, result)
        return result

    except Exception as e:
        conn.close()
        return {"error": str(e), "sql": sql}

def quick_analytics(file_id: str) -> dict:
    """Run quick analytics on dataset."""
    table_name = get_table_name(file_id)
    conn = duckdb.connect(DUCKDB_PATH)
    try:
        # Row count
        count = conn.execute(f"SELECT COUNT(*) as total FROM {table_name}").fetchone()[0]
        # Column info
        cols = conn.execute(f"PRAGMA table_info({table_name})").fetchdf()
        conn.close()
        return {
            "total_rows": count,
            "total_columns": len(cols),
            "table_name": table_name,
        }
    except Exception as e:
        conn.close()
        return {"error": str(e)}

def get_schema_context(file_id: str, profile: dict) -> str:
    """Get compact schema context for LLM."""
    table_name = get_table_name(file_id)
    schema = f"Table: {table_name}\n"
    schema += f"Rows: {profile.get('rows', 'unknown')}\n"
    schema += f"Columns: {', '.join(profile.get('column_names', []))}\n"
    schema += f"Numeric columns: {', '.join(profile.get('numeric_columns', []))}\n"
    schema += f"Categorical columns: {', '.join(profile.get('categorical_columns', []))}\n"

    # Add numeric stats
    if profile.get("numeric_stats"):
        schema += "\nNumeric Statistics:\n"
        for col, stats in list(profile["numeric_stats"].items())[:5]:
            schema += f"  {col}: min={stats.get('min')}, max={stats.get('max')}, mean={stats.get('mean')}, sum={stats.get('sum')}\n"

    return schema[:MAX_CONTEXT_CHARS]