"""
Price analysis and statistics.
"""
import statistics
from dataclasses import dataclass, asdict
from typing import Any

from .ebay_service import EbayItem


@dataclass
class PriceStats:
    """Price statistics for a set of items."""

    count: int
    average: float
    median: float
    min: float
    max: float
    std_dev: float

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)


@dataclass
class PriceComparison:
    """Comparison between sold and active prices."""

    avg_price_difference: float
    avg_price_difference_percent: float
    recommendation: str

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)


def calculate_price_stats(items: list[EbayItem]) -> PriceStats | None:
    """
    Calculate price statistics from a list of items.

    Args:
        items: List of eBay items

    Returns:
        PriceStats object or None if no valid prices
    """
    if not items:
        return None

    prices = [item.price for item in items if item.price > 0]

    if not prices:
        return None

    return PriceStats(
        count=len(prices),
        average=round(statistics.mean(prices), 2),
        median=round(statistics.median(prices), 2),
        min=round(min(prices), 2),
        max=round(max(prices), 2),
        std_dev=round(statistics.stdev(prices), 2) if len(prices) > 1 else 0,
    )


def compare_prices(
    sold_stats: PriceStats | None, active_stats: PriceStats | None
) -> PriceComparison | None:
    """
    Compare sold vs active price statistics.

    Args:
        sold_stats: Statistics for sold items
        active_stats: Statistics for active items

    Returns:
        PriceComparison object or None if comparison not possible
    """
    if not sold_stats or not active_stats:
        return None

    avg_diff = active_stats.average - sold_stats.average

    if sold_stats.average == 0:
        percent_diff = 0.0
    else:
        percent_diff = round((avg_diff / sold_stats.average) * 100, 1)

    if avg_diff < 0:
        recommendation = "underpriced"
    elif avg_diff > 0:
        recommendation = "overpriced"
    else:
        recommendation = "fair"

    return PriceComparison(
        avg_price_difference=round(avg_diff, 2),
        avg_price_difference_percent=percent_diff,
        recommendation=recommendation,
    )
