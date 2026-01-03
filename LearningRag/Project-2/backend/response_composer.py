"""
Response Composer Module

This module provides AI-powered summarization of forecast results.
It takes structured forecast output and generates human-readable summaries.

Following the architecture principles:
- AI ONLY summarizes and explains
- AI does NOT recalculate values
- AI does NOT modify numbers
- AI references data sources
"""

from typing import Dict, Any, Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
import os


def get_llm():
    """Get the LLM for response composition."""
    api_token = os.environ.get("HUGGINGFACE_API_TOKEN", "")
    
    endpoint = HuggingFaceEndpoint(
        repo_id="mistralai/Mistral-7B-Instruct-v0.2",
        task="conversational",
        temperature=0.3,
        max_new_tokens=500,
        huggingfacehub_api_token=api_token
    )
    
    return ChatHuggingFace(llm=endpoint)


SUMMARY_PROMPT = """You are a financial analyst AI assistant. You summarize forecast results clearly and concisely.

RULES:
- NEVER recalculate or modify any numbers
- ONLY use the exact values provided
- Keep the summary brief and actionable
- Reference the data source and time period
- Be professional and objective

FORECAST RESULTS:
Entity: {entity}
Metric: {metric}
Forecast Horizon: {horizon} days
Model: {model}

METRICS:
- Trend: {trend}
- Average Growth Rate: {growth_rate}
- Volatility: {volatility}
- Confidence Score: {confidence}

FORECAST PREVIEW (first 5 predictions):
{forecast_preview}

Historical Data: {historical_records} records
Last Updated: {last_updated}

Generate a 2-3 sentence summary of this forecast. Be specific about the trend and include the confidence level."""


def compose_response(
    forecast_result: Dict[str, Any],
    use_llm: bool = True
) -> str:
    """
    Compose a human-readable response from forecast results.
    
    Args:
        forecast_result: Structured output from ForecastingPipeline
        use_llm: Whether to use LLM for summarization (False for fallback)
    
    Returns:
        Human-readable summary string
    """
    metadata = forecast_result.get("metadata", {})
    metrics = forecast_result.get("metrics", {})
    forecasts = forecast_result.get("forecast", [])
    
    # Prepare forecast preview
    preview_lines = []
    for pred in forecasts[:5]:
        preview_lines.append(
            f"  {pred['ds']}: {pred['yhat']:.2f} [{pred['yhat_lower']:.2f}, {pred['yhat_upper']:.2f}]"
        )
    forecast_preview = "\n".join(preview_lines)
    
    if use_llm:
        try:
            llm = get_llm()
            prompt = ChatPromptTemplate.from_messages([
                ("user", SUMMARY_PROMPT)
            ])
            
            formatted = prompt.format_messages(
                entity=metadata.get("entity", "Unknown"),
                metric=metadata.get("metric", "Unknown"),
                horizon=metadata.get("horizon_days", 0),
                model=metadata.get("model", "prophet"),
                trend=metrics.get("trend", "unknown"),
                growth_rate=f"{metrics.get('avg_growth_rate', 0) * 100:.2f}%",
                volatility=metrics.get("volatility", "unknown"),
                confidence=f"{metrics.get('confidence', 0) * 100:.1f}%",
                forecast_preview=forecast_preview,
                historical_records=metadata.get("historical_records", 0),
                last_updated=metadata.get("last_updated", "Unknown")
            )
            
            response = llm.invoke(formatted)
            return response.content
            
        except Exception as e:
            # Fall back to template-based summary
            print(f"LLM summarization failed, using fallback: {e}")
            return _compose_fallback(metadata, metrics, forecasts)
    else:
        return _compose_fallback(metadata, metrics, forecasts)


def _compose_fallback(
    metadata: Dict[str, Any],
    metrics: Dict[str, Any],
    forecasts: list
) -> str:
    """
    Generate a template-based summary without LLM.
    
    Args:
        metadata: Forecast metadata
        metrics: Computed metrics
        forecasts: List of forecast predictions
    
    Returns:
        Template-based summary string
    """
    entity = metadata.get("entity", "Unknown")
    metric = metadata.get("metric", "value")
    horizon = metadata.get("horizon_days", 0)
    trend = metrics.get("trend", "stable")
    confidence = metrics.get("confidence", 0)
    volatility = metrics.get("volatility", "moderate")
    growth_rate = metrics.get("avg_growth_rate", 0)
    
    # Get first and last predictions
    if forecasts:
        first_pred = forecasts[0]["yhat"]
        last_pred = forecasts[-1]["yhat"]
    else:
        first_pred = last_pred = 0
    
    # Build trend description
    if trend == "upward":
        trend_desc = f"is expected to increase"
    elif trend == "downward":
        trend_desc = f"is expected to decrease"
    else:
        trend_desc = "is expected to remain relatively stable"
    
    # Build confidence description
    if confidence >= 0.7:
        conf_desc = "high"
    elif confidence >= 0.4:
        conf_desc = "moderate"
    else:
        conf_desc = "low"
    
    summary = (
        f"Based on the {horizon}-day forecast for {entity} {metric}, the price {trend_desc} "
        f"with {volatility} volatility. "
        f"The model predicts a move from ${first_pred:.2f} to ${last_pred:.2f} "
        f"with {conf_desc} confidence ({confidence*100:.1f}%). "
        f"Average daily growth rate is {growth_rate*100:.4f}%."
    )
    
    return summary


def format_full_response(
    forecast_result: Dict[str, Any],
    summary: str
) -> Dict[str, Any]:
    """
    Format the complete response for the frontend.
    
    Args:
        forecast_result: Original forecast output
        summary: AI-generated or template summary
    
    Returns:
        Complete response object with summary included
    """
    return {
        "status": "success",
        "summary": summary,
        "forecast": forecast_result.get("forecast", []),
        "metrics": forecast_result.get("metrics", {}),
        "metadata": forecast_result.get("metadata", {}),
        "visualization": {
            "enabled": True,
            "type": "line",
            "x": "ds",
            "y": ["yhat", "yhat_lower", "yhat_upper"]
        }
    }
