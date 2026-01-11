"""
Configuration management for Snout API.
"""
import os
import logging
from dataclasses import dataclass


def _mask_credential(value: str | None, visible_chars: int = 4) -> str | None:
    """
    Create a masked preview of a credential value.

    Args:
        value: The credential value to mask
        visible_chars: Number of characters to show at start and end

    Returns:
        Masked string like "your***here" or None if value is None/empty
    """
    if not value:
        return None
    if len(value) <= visible_chars * 2:
        return "*" * len(value)
    return f"{value[:visible_chars]}***{value[-visible_chars:]}"


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

    @property
    def has_app_id(self) -> bool:
        """Check if eBay App ID is configured."""
        return bool(self.ebay_app_id)

    @property
    def has_cert_id(self) -> bool:
        """Check if eBay Cert ID is configured."""
        return bool(self.ebay_cert_id)

    @property
    def has_oauth_token(self) -> bool:
        """Check if eBay OAuth token is configured."""
        return bool(self.ebay_oauth_token)

    def get_credentials_status(self, include_masked: bool = True) -> dict:
        """
        Get status of all credentials without exposing values.

        Args:
            include_masked: Whether to include masked previews

        Returns:
            Dictionary with credential status information
        """
        status = {
            "ebay_app_id": {"configured": self.has_app_id},
            "ebay_cert_id": {"configured": self.has_cert_id},
            "ebay_oauth_token": {"configured": self.has_oauth_token},
        }
        if include_masked:
            status["ebay_app_id"]["preview"] = _mask_credential(self.ebay_app_id)
            status["ebay_cert_id"]["preview"] = _mask_credential(self.ebay_cert_id)
            status["ebay_oauth_token"]["preview"] = _mask_credential(self.ebay_oauth_token)
        return status


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
