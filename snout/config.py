"""
Configuration management for Snout API.
"""
import os
import logging
from dataclasses import dataclass


@dataclass
class Config:
    """Application configuration."""

    # eBay API settings
    ebay_app_id: str | None
    ebay_cert_id: str | None
    ebay_oauth_token: str | None

    # API endpoints
    ebay_finding_api: str = "https://svcs.ebay.com/services/search/FindingService/v1"
    ebay_browse_api: str = "https://api.ebay.com/buy/browse/v1"

    # Request settings
    request_timeout: int = 30
    max_results_per_page: int = 100

    # Validation limits
    max_keyword_length: int = 1000
    min_keyword_length: int = 1

    # Rate limiting
    rate_limit_default: str = "100 per minute"
    rate_limit_search: str = "30 per minute"

    @classmethod
    def from_env(cls) -> "Config":
        """Load configuration from environment variables."""
        return cls(
            ebay_app_id=os.environ.get("EBAY_APP_ID"),
            ebay_cert_id=os.environ.get("EBAY_CERT_ID"),
            ebay_oauth_token=os.environ.get("EBAY_OAUTH_TOKEN"),
        )

    @property
    def is_ebay_configured(self) -> bool:
        """Check if eBay API is configured."""
        return bool(self.ebay_app_id)


# eBay condition ID mapping
CONDITION_MAP = {
    "new": "1000",
    "open_box": "1500",
    "refurbished": "2000",
    "used": "3000",
    "for_parts": "7000",
}

# eBay sort order mapping
SORT_MAP = {
    "best_match": "BestMatch",
    "price_asc": "PricePlusShippingLowest",
    "price_desc": "PricePlusShippingHighest",
    "date_asc": "EndTimeSoonest",
    "date_desc": "StartTimeNewest",
}


def setup_logging(level: int = logging.INFO) -> logging.Logger:
    """Configure application logging."""
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    return logging.getLogger("snout")
