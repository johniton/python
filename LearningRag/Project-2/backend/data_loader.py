"""
Data Loader Module

Loads historical data from CSV/Excel files and prepares it for the forecasting pipeline.
Handles the AAPL stock data format used in the hackathon demo.
"""

import pandas as pd
import os
from typing import Optional, List

# Path to the data directory (relative to backend folder)
DATA_DIR = os.path.join(os.path.dirname(__file__), "..")


def load_stock_data(file_path: str = None) -> pd.DataFrame:
    """
    Load stock data from CSV file.
    
    Args:
        file_path: Path to CSV file. If None, loads default AAPL data.
    
    Returns:
        DataFrame with columns: ds (datetime), y (close price), Volume
    """
    if file_path is None:
        file_path = os.path.join(DATA_DIR, "AAPL_stock_data.csv")
    
    # Read CSV with special format (has header rows to skip)
    df_raw = pd.read_csv(file_path, skiprows=2)
    df_raw.columns = ['Date', 'Close', 'High', 'Low', 'Open', 'Volume']
    
    # Convert types
    for col in ['Close', 'High', 'Low', 'Open', 'Volume']:
        df_raw[col] = pd.to_numeric(df_raw[col], errors='coerce')
    df_raw['Date'] = pd.to_datetime(df_raw['Date'], errors='coerce')
    df_raw = df_raw.dropna().reset_index(drop=True)
    
    # Prepare for forecasting pipeline (rename to ds, y)
    historical_data = pd.DataFrame({
        'ds': df_raw['Date'],
        'y': df_raw['Close'],
        'Volume': df_raw['Volume'],
        'High': df_raw['High'],
        'Low': df_raw['Low'],
        'Open': df_raw['Open']
    })
    
    return historical_data


def get_available_entities() -> List[str]:
    """
    Get list of available entities (stocks) that can be forecasted.
    For now, only AAPL is available from the dataset.
    
    Returns:
        List of entity names
    """
    return ["AAPL"]


def get_available_metrics() -> List[str]:
    """
    Get list of available metrics that can be forecasted.
    
    Returns:
        List of metric names
    """
    return ["close_price", "volume", "high", "low", "open"]


def prepare_data_for_forecast(
    entity: str,
    metric: str,
    include_regressors: Optional[List[str]] = None
) -> pd.DataFrame:
    """
    Prepare data for forecasting based on entity and metric.
    
    Args:
        entity: Entity to forecast (e.g., "AAPL")
        metric: Metric to forecast (e.g., "close_price")
        include_regressors: Optional list of regressor column names
    
    Returns:
        DataFrame ready for ForecastingPipeline (ds, y, and optional regressors)
    """
    # Load the raw data
    df = load_stock_data()
    
    # Map metric names to columns
    metric_column_map = {
        "close_price": "y",  # Already named correctly
        "volume": "Volume",
        "high": "High",
        "low": "Low",
        "open": "Open"
    }
    
    # Get the target column
    target_col = metric_column_map.get(metric, "y")
    
    # Build output dataframe
    result = pd.DataFrame({
        'ds': df['ds'],
        'y': df[target_col] if target_col != "y" else df['y']
    })
    
    # Add regressors if specified
    if include_regressors:
        for reg in include_regressors:
            if reg in df.columns:
                result[reg] = df[reg]
    
    return result
