from prophet import Prophet
import pandas as pd
import io

async def run_forecast(contents: bytes, filename: str, date_col: str, value_col: str, periods: int = 30):
    # Read file
    if filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))

    # Validate columns exist
    if date_col not in df.columns:
        raise ValueError(f"Column '{date_col}' not found. Available columns: {list(df.columns)}")
    if value_col not in df.columns:
        raise ValueError(f"Column '{value_col}' not found. Available columns: {list(df.columns)}")

    # Rename to Prophet format
    df_prophet = df[[date_col, value_col]].rename(
        columns={date_col: "ds", value_col: "y"}
    )
    df_prophet["ds"] = pd.to_datetime(df_prophet["ds"])
    df_prophet["y"] = pd.to_numeric(df_prophet["y"])
    df_prophet = df_prophet.dropna()

    # Train Prophet
    model = Prophet()
    model.fit(df_prophet)

    # Predict
    future = model.make_future_dataframe(periods=periods, freq="MS")
    forecast = model.predict(future)

    # Return only future predictions
    future_only = forecast[forecast["ds"] > df_prophet["ds"].max()]
    result = future_only[["ds", "yhat", "yhat_lower", "yhat_upper"]].copy()
    result["ds"] = result["ds"].dt.strftime("%Y-%m-%d")

    return {
        "date_column": date_col,
        "value_column": value_col,
        "periods_forecasted": periods,
        "forecast": result.to_dict(orient="records")
    }