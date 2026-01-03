from pydantic import BaseModel
from typing import Optional, Dict, Any, Literal, List


class AnalyticsIntent(BaseModel):
    entity: Optional[str]
    metric: str
    time_range: str
    operation: Optional[str] = None


class ForecastingIntent(BaseModel):
    """Intent extracted by Router LLM for forecasting queries."""
    entity: str
    metric: str
    horizon: str  # e.g., "30 days", "3 months"
    granularity: Literal["daily", "weekly", "monthly", "quarterly"] = "daily"
    # Optional advanced fields
    regressors: Optional[List[str]] = None
    seasonality: Optional[Dict[str, bool]] = None


class RAGIntent(BaseModel):
    topic: str
    document_type: Optional[
        Literal["definition", "policy", "methodology", "source", "explanation"]
    ] = None


class RouterOutput(BaseModel):
    route: Literal["analytics", "forecast", "rag", "both", "clarification"]

    analytics_intent: Optional[AnalyticsIntent] = None
    forecast_intent: Optional[ForecastingIntent] = None
    rag_intent: Optional[RAGIntent] = None

    needs_clarification: bool = False


class ConversationState(BaseModel):
    last_route: Optional[str] = None
    last_intent: Optional[RouterOutput] = None


# Forecasting Pipeline Schemas

class ForecastRequest(BaseModel):
    """Request schema for executing a forecast."""
    entity: str
    metric: str = "close_price"
    horizon_periods: int = 30
    horizon_unit: Literal["days", "weeks", "months"] = "days"
    granularity: Literal["daily", "weekly", "monthly"] = "daily"
    include_regressors: Optional[List[str]] = None


class ForecastMetrics(BaseModel):
    """Metrics computed from forecast results."""
    trend: Literal["upward", "downward", "flat"]
    avg_growth_rate: float
    volatility: Literal["low", "medium", "high"]
    volatility_value: float
    uncertainty_width: float
    confidence: float


class ForecastPrediction(BaseModel):
    """Single prediction point."""
    ds: str
    yhat: float
    yhat_lower: float
    yhat_upper: float


class ForecastMetadata(BaseModel):
    """Metadata about the forecast run."""
    entity: str
    metric: str
    horizon_days: int
    model: str
    last_updated: str
    historical_records: int
    forecast_records: int


class ForecastResult(BaseModel):
    """Complete forecast result from the pipeline."""
    status: Literal["success", "error"] = "success"
    summary: Optional[str] = None
    forecast: List[ForecastPrediction]
    metrics: ForecastMetrics
    metadata: ForecastMetadata
    error: Optional[str] = None


class QueryRequest(BaseModel):
    """Request for full end-to-end query handling."""
    question: str
    include_visualization: bool = True


class QueryResponse(BaseModel):
    """Complete response from query handling."""
    route: str
    summary: Optional[str] = None
    forecast: Optional[Dict[str, Any]] = None
    analytics: Optional[Dict[str, Any]] = None
    rag: Optional[Dict[str, Any]] = None
    needs_clarification: bool = False
    clarification_message: Optional[str] = None
