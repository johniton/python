"""
Main FastAPI Application

This is the main entry point for the backend API.
It integrates:
- Router LLM for intent classification
- Forecasting Pipeline for predictions
- Response Composer for AI summaries
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re
from typing import Optional

from router_llm import route_question
from schema import (
    ForecastRequest, 
    ForecastingIntent,
    QueryRequest,
    QueryResponse,
    ConversationState
)
from forecasting_pipeline import ForecastingPipeline, build_forecast_request
from data_loader import prepare_data_for_forecast, get_available_entities
from response_composer import compose_response, format_full_response


class Question(BaseModel):
    question: str


app = FastAPI(
    title="Analytics & Forecasting Copilot",
    description="AI-powered analytics and forecasting API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Helper Functions
# ============================================================================

def parse_horizon(horizon_str: str) -> tuple[int, str]:
    """
    Parse horizon string like "30 days" or "3 months" into (periods, unit).
    
    Args:
        horizon_str: Human-readable horizon string
    
    Returns:
        Tuple of (periods, unit)
    """
    horizon_str = horizon_str.lower().strip()
    
    # Try to extract number and unit
    match = re.match(r'(\d+)\s*(day|week|month|quarter)s?', horizon_str)
    if match:
        periods = int(match.group(1))
        unit = match.group(2)
        # Normalize unit
        unit_map = {
            "day": "days",
            "week": "weeks", 
            "month": "months",
            "quarter": "months"  # Convert quarters to months
        }
        if unit == "quarter":
            periods *= 3
        return periods, unit_map.get(unit, "days")
    
    # Default fallback
    return 30, "days"


def execute_forecast(intent: ForecastingIntent) -> dict:
    """
    Execute forecasting pipeline based on intent.
    
    Args:
        intent: ForecastingIntent from Router LLM
    
    Returns:
        Formatted forecast result with summary
    """
    # Parse horizon
    periods, unit = parse_horizon(intent.horizon)
    
    # Validate entity exists
    if intent.entity.upper() not in [e.upper() for e in get_available_entities()]:
        raise HTTPException(
            status_code=400,
            detail=f"Entity '{intent.entity}' not found. Available: {get_available_entities()}"
        )
    
    # Prepare data
    regressors = intent.regressors or []
    historical_data = prepare_data_for_forecast(
        entity=intent.entity,
        metric=intent.metric,
        include_regressors=regressors
    )
    
    # Build forecast request
    regressor_configs = [{"name": r, "normalize": True} for r in regressors]
    forecast_request = build_forecast_request(
        entity=intent.entity,
        metric=intent.metric,
        horizon_periods=periods,
        horizon_unit=unit,
        granularity=intent.granularity,
        seasonality=intent.seasonality,
        regressors=regressor_configs
    )
    
    # Execute pipeline
    pipeline = ForecastingPipeline()
    result = pipeline.run_forecast(forecast_request, historical_data)
    
    # Generate summary (using fallback since LLM may not be configured)
    summary = compose_response(result, use_llm=False)
    
    # Format full response
    return format_full_response(result, summary)


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "Analytics & Forecasting Copilot",
        "version": "1.0.0"
    }


@app.get("/entities")
def list_entities():
    """Get available entities for forecasting."""
    return {"entities": get_available_entities()}


@app.post("/route")
def route(q: Question):
    """
    Route a natural language question to the appropriate pipeline.
    Returns structured intent without executing the pipeline.
    """
    result = route_question(q.question)
    return result


@app.post("/forecast")
def forecast(request: ForecastRequest):
    """
    Execute a forecast directly with explicit parameters.
    Bypasses the router for direct API access.
    """
    try:
        # Convert ForecastRequest to ForecastingIntent
        intent = ForecastingIntent(
            entity=request.entity,
            metric=request.metric,
            horizon=f"{request.horizon_periods} {request.horizon_unit}",
            granularity=request.granularity,
            regressors=request.include_regressors
        )
        
        result = execute_forecast(intent)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/query")
def query(request: QueryRequest):
    """
    Full end-to-end query handler.
    Routes the question and executes the appropriate pipeline.
    """
    try:
        # Step 1: Route the question
        router_output = route_question(request.question)
        
        # Step 2: Handle based on route
        response = QueryResponse(
            route=router_output.route,
            needs_clarification=router_output.needs_clarification
        )
        
        if router_output.route == "clarification":
            response.clarification_message = (
                "I need more information to help you. "
                "Could you please specify the entity, metric, and time period?"
            )
            return response
        
        if router_output.route == "forecast" and router_output.forecast_intent:
            # Execute forecast
            forecast_result = execute_forecast(router_output.forecast_intent)
            response.forecast = forecast_result
            response.summary = forecast_result.get("summary")
            return response
        
        if router_output.route == "analytics":
            # Analytics pipeline not yet implemented
            response.analytics = {"message": "Analytics pipeline coming soon"}
            response.summary = "Analytics pipeline is under development."
            return response
        
        if router_output.route == "rag":
            # RAG pipeline not yet implemented
            response.rag = {"message": "RAG pipeline coming soon"}
            response.summary = "Document search pipeline is under development."
            return response
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/forecast/simple")
def forecast_simple(
    entity: str = "AAPL",
    periods: int = 30,
    metric: str = "close_price"
):
    """
    Simple forecast endpoint for quick testing.
    Uses query parameters instead of JSON body.
    """
    try:
        intent = ForecastingIntent(
            entity=entity,
            metric=metric,
            horizon=f"{periods} days",
            granularity="daily"
        )
        
        result = execute_forecast(intent)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
