"""
eBay Browse API client.
"""
import logging
from dataclasses import dataclass
from typing import Any

import requests

from ..config import BROWSE_BUYING_OPTIONS_MAP, BROWSE_CONDITION_MAP, BROWSE_SORT_MAP, Config
from .auth_service import EbayAuthService

logger = logging.getLogger("snout.browse")


@dataclass
class BrowseSearchQuery:
    """Browse API search parameters."""

    keywords: str
    condition: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    sort: str | None = None
    listing_type: str | None = None
    uk_only: bool = False
    marketplace: str = "EBAY_GB"
    limit: int = 50
    offset: int = 0


@dataclass
class BrowseItem:
    """Parsed item from Browse API."""

    title: str
    item_price: float
    shipping_cost: float
    total_price: float
    currency: str
    item_id: str
    url: str
    condition: str
    image_url: str | None = None


class BrowseApiError(Exception):
    """Raised when Browse API calls fail."""

    pass


class EbayBrowseService:
    """Service for eBay Browse API item_summary/search."""

    def __init__(self, config: Config, auth_service: EbayAuthService):
        self._config = config
        self._auth = auth_service
        self._session = requests.Session()

    def search(self, query: BrowseSearchQuery) -> list[BrowseItem]:
        """
        Search active listings via Browse API.

        Args:
            query: Search parameters

        Returns:
            List of BrowseItem results

        Raises:
            BrowseApiError: If the API request fails
        """
        try:
            token = self._auth.get_token()
            data = self._make_request(query, token)
            return self._parse_results(data)
        except requests.RequestException as e:
            logger.error("Browse API request failed: %s", e)
            raise BrowseApiError("Failed to communicate with eBay Browse API") from e

    def _make_request(self, query: BrowseSearchQuery, token: str) -> dict[str, Any]:
        """Make the Browse API search request."""
        headers = {
            "Authorization": f"Bearer {token}",
            "X-EBAY-C-MARKETPLACE-ID": query.marketplace,
            "Content-Type": "application/json",
        }

        params: dict[str, str] = {
            "q": query.keywords,
            "limit": str(query.limit),
            "offset": str(query.offset),
        }

        # Build filter string
        filters = []
        if query.condition and query.condition.lower() in BROWSE_CONDITION_MAP:
            filters.append(
                f"conditionIds:{{{BROWSE_CONDITION_MAP[query.condition.lower()]}}}"
            )
        if query.min_price is not None:
            filters.append(f"price:[{query.min_price}..],priceCurrency:GBP")
        if query.max_price is not None:
            filters.append(f"price:[..{query.max_price}],priceCurrency:GBP")
        if query.listing_type and query.listing_type.lower() in BROWSE_BUYING_OPTIONS_MAP:
            filters.append(
                f"buyingOptions:{{{BROWSE_BUYING_OPTIONS_MAP[query.listing_type.lower()]}}}"
            )
        if query.uk_only:
            filters.append("itemLocationCountry:GB")

        if filters:
            params["filter"] = ",".join(filters)

        # Sort
        if query.sort and query.sort.lower() in BROWSE_SORT_MAP:
            params["sort"] = BROWSE_SORT_MAP[query.sort.lower()]

        logger.debug("Browse API request: q=%s, params=%s", query.keywords, params)

        response = self._session.get(
            self._config.ebay_browse_api,
            headers=headers,
            params=params,
            timeout=self._config.request_timeout,
        )
        response.raise_for_status()
        return response.json()

    def _parse_results(self, data: dict[str, Any]) -> list[BrowseItem]:
        """Parse Browse API response into BrowseItem list."""
        results = []
        items = data.get("itemSummaries", [])
        parse_errors = 0

        for item in items:
            try:
                parsed = self._parse_item(item)
                results.append(parsed)
            except (KeyError, ValueError, TypeError) as e:
                parse_errors += 1
                logger.debug("Failed to parse browse item: %s", e)
                continue

        if parse_errors:
            logger.warning(
                "Failed to parse %d of %d browse items", parse_errors, len(items)
            )

        return results

    def _parse_item(self, item: dict[str, Any]) -> BrowseItem:
        """Parse a single item from the Browse API response."""
        price_data = item.get("price", {})
        item_price = float(price_data.get("value", 0))
        currency = price_data.get("currency", "GBP")

        # Shipping cost from first shipping option
        shipping_cost = 0.0
        shipping_options = item.get("shippingOptions", [])
        if shipping_options:
            ship_cost_data = shipping_options[0].get("shippingCost", {})
            shipping_cost = float(ship_cost_data.get("value", 0))

        # Image
        image = item.get("image", {})
        image_url = image.get("imageUrl")

        # Condition
        condition = item.get("condition", "Unknown")

        return BrowseItem(
            title=item.get("title", ""),
            item_price=item_price,
            shipping_cost=shipping_cost,
            total_price=round(item_price + shipping_cost, 2),
            currency=currency,
            item_id=item.get("itemId", ""),
            url=item.get("itemWebUrl", ""),
            condition=condition,
            image_url=image_url,
        )
