"""
eBay Finding API service.
"""
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Any

import requests

from ..config import CONDITION_MAP, SORT_MAP, Config

logger = logging.getLogger("snout.ebay")


@dataclass
class SearchQuery:
    """Search query parameters."""

    keywords: str
    sold: bool = False
    condition: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    sort: str | None = None


@dataclass
class EbayItem:
    """Parsed eBay item."""

    title: str
    price: float
    currency: str
    item_id: str
    url: str
    condition: str
    listing_type: str
    sold_date: str | None = None


class EbayApiError(Exception):
    """Custom exception for eBay API errors."""

    pass


class EbayFindingService:
    """Service for interacting with eBay Finding API."""

    def __init__(self, config: Config):
        self.config = config
        self._session = requests.Session()

    def search(self, query: SearchQuery) -> list[EbayItem]:
        """
        Search eBay using the Finding API.

        Args:
            query: Search parameters

        Returns:
            List of parsed eBay items

        Raises:
            EbayApiError: If the API request fails
        """
        if not self.config.is_ebay_configured:
            raise EbayApiError("eBay API is not configured")

        try:
            data = self._make_api_request(query)
            return self._parse_results(data, query.sold)
        except requests.RequestException as e:
            logger.error("eBay API request failed: %s", str(e))
            raise EbayApiError("Failed to communicate with eBay API") from e

    def search_concurrent(
        self, sold_query: SearchQuery, active_query: SearchQuery
    ) -> tuple[list[EbayItem], list[EbayItem]]:
        """
        Execute sold and active searches concurrently.

        Args:
            sold_query: Query for sold items
            active_query: Query for active items

        Returns:
            Tuple of (sold_items, active_items)

        Raises:
            EbayApiError: If either API request fails
        """
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = {
                executor.submit(self.search, sold_query): "sold",
                executor.submit(self.search, active_query): "active",
            }

            results = {}
            for future in as_completed(futures):
                key = futures[future]
                results[key] = future.result()

        return results["sold"], results["active"]

    def _make_api_request(self, query: SearchQuery) -> dict[str, Any]:
        """Make the actual API request to eBay."""
        operation = "findCompletedItems" if query.sold else "findItemsByKeywords"

        params = {
            "OPERATION-NAME": operation,
            "SERVICE-VERSION": "1.0.0",
            "SECURITY-APPNAME": self.config.ebay_app_id,
            "RESPONSE-DATA-FORMAT": "JSON",
            "REST-PAYLOAD": "",
            "keywords": query.keywords,
            "paginationInput.entriesPerPage": str(self.config.max_results_per_page),
        }

        # Sort order
        if query.sort and query.sort.lower() in SORT_MAP:
            params["sortOrder"] = SORT_MAP[query.sort.lower()]

        filter_index = 0

        if query.sold:
            params[f"itemFilter({filter_index}).name"] = "SoldItemsOnly"
            params[f"itemFilter({filter_index}).value"] = "true"
            filter_index += 1

        if query.condition and query.condition.lower() in CONDITION_MAP:
            params[f"itemFilter({filter_index}).name"] = "Condition"
            params[f"itemFilter({filter_index}).value"] = CONDITION_MAP[
                query.condition.lower()
            ]
            filter_index += 1

        if query.min_price is not None:
            params[f"itemFilter({filter_index}).name"] = "MinPrice"
            params[f"itemFilter({filter_index}).value"] = str(query.min_price)
            filter_index += 1

        if query.max_price is not None:
            params[f"itemFilter({filter_index}).name"] = "MaxPrice"
            params[f"itemFilter({filter_index}).value"] = str(query.max_price)
            filter_index += 1

        logger.debug("Making eBay API request: operation=%s, keywords=%s", operation, query.keywords)

        response = self._session.get(
            self.config.ebay_finding_api,
            params=params,
            timeout=self.config.request_timeout,
        )
        response.raise_for_status()
        return response.json()

    def _parse_results(self, data: dict[str, Any], sold: bool) -> list[EbayItem]:
        """Parse results from the Finding API response."""
        results = []
        response_key = "findCompletedItemsResponse" if sold else "findItemsByKeywordsResponse"

        if response_key not in data:
            logger.warning("Response missing expected key: %s", response_key)
            return results

        try:
            response = data[response_key][0]
        except (IndexError, KeyError) as e:
            logger.warning("Failed to extract response: %s", e)
            return results

        ack = response.get("ack", [None])[0]
        if ack != "Success":
            logger.warning("eBay API returned non-success ack: %s", ack)
            return results

        search_result = response.get("searchResult", [{}])[0]
        items = search_result.get("item", [])
        parse_errors = 0

        for item in items:
            try:
                parsed = self._parse_item(item, sold)
                results.append(parsed)
            except (KeyError, IndexError, ValueError, TypeError) as e:
                parse_errors += 1
                logger.debug("Failed to parse item: %s", e)
                continue

        if parse_errors > 0:
            logger.warning(
                "Failed to parse %d of %d items", parse_errors, len(items)
            )

        return results

    def _parse_item(self, item: dict[str, Any], sold: bool) -> EbayItem:
        """Parse a single item from the API response."""
        price_info = item.get("sellingStatus", [{}])[0]
        current_price = price_info.get("currentPrice", [{}])[0]

        condition_data = item.get("condition", [{}])
        if condition_data:
            condition_name = condition_data[0].get("conditionDisplayName", ["Unknown"])
            condition = condition_name[0] if isinstance(condition_name, list) else condition_name
        else:
            condition = "Unknown"

        sold_date = None
        if sold:
            sold_date = item.get("listingInfo", [{}])[0].get("endTime", [""])[0]

        return EbayItem(
            title=item.get("title", [""])[0],
            price=float(current_price.get("__value__", 0)),
            currency=current_price.get("@currencyId", "USD"),
            item_id=item.get("itemId", [""])[0],
            url=item.get("viewItemURL", [""])[0],
            condition=condition,
            listing_type=item.get("listingInfo", [{}])[0].get("listingType", ["Unknown"])[0],
            sold_date=sold_date,
        )
