"""Tests for Snout API."""
import pytest
from unittest.mock import patch, MagicMock
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import (
    parse_finding_results,
    calculate_price_stats,
    build_filters_response,
    CONDITION_MAP,
    SORT_MAP,
)


class TestParseFindinResults:
    """Tests for parse_finding_results function."""

    def test_parse_sold_items(self, mock_ebay_sold_response):
        """Test parsing sold items from eBay response."""
        results = parse_finding_results(mock_ebay_sold_response, sold=True)

        assert len(results) == 3
        assert results[0]["title"] == "Nintendo Switch Console"
        assert results[0]["price"] == 250.00
        assert results[0]["currency"] == "USD"
        assert results[0]["item_id"] == "123456789"
        assert "sold_date" in results[0]

    def test_parse_active_items(self, mock_ebay_active_response):
        """Test parsing active items from eBay response."""
        results = parse_finding_results(mock_ebay_active_response, sold=False)

        assert len(results) == 2
        assert results[0]["title"] == "Nintendo Switch Console New"
        assert results[0]["price"] == 320.00
        assert "sold_date" not in results[0]

    def test_parse_empty_response(self, mock_ebay_empty_response):
        """Test parsing empty response."""
        results = parse_finding_results(mock_ebay_empty_response, sold=False)
        assert results == []

    def test_parse_invalid_response(self):
        """Test parsing invalid/missing response."""
        results = parse_finding_results({}, sold=False)
        assert results == []

    def test_parse_failed_response(self):
        """Test parsing a failed API response."""
        data = {
            "findItemsByKeywordsResponse": [{
                "ack": ["Failure"],
                "errorMessage": [{"error": [{"message": ["Invalid request"]}]}]
            }]
        }
        results = parse_finding_results(data, sold=False)
        assert results == []


class TestCalculatePriceStats:
    """Tests for calculate_price_stats function."""

    def test_calculate_stats_multiple_items(self):
        """Test calculating stats with multiple items."""
        items = [
            {"price": 100.00},
            {"price": 200.00},
            {"price": 300.00},
        ]
        stats = calculate_price_stats(items)

        assert stats["count"] == 3
        assert stats["average"] == 200.00
        assert stats["median"] == 200.00
        assert stats["min"] == 100.00
        assert stats["max"] == 300.00
        assert stats["std_dev"] == 100.00

    def test_calculate_stats_single_item(self):
        """Test calculating stats with a single item."""
        items = [{"price": 150.00}]
        stats = calculate_price_stats(items)

        assert stats["count"] == 1
        assert stats["average"] == 150.00
        assert stats["median"] == 150.00
        assert stats["std_dev"] == 0

    def test_calculate_stats_empty_list(self):
        """Test calculating stats with empty list."""
        stats = calculate_price_stats([])
        assert stats is None

    def test_calculate_stats_zero_prices(self):
        """Test that zero prices are filtered out."""
        items = [
            {"price": 100.00},
            {"price": 0},
            {"price": 200.00},
        ]
        stats = calculate_price_stats(items)

        assert stats["count"] == 2
        assert stats["average"] == 150.00


class TestBuildFiltersResponse:
    """Tests for build_filters_response function."""

    def test_build_with_all_filters(self):
        """Test building response with all filters."""
        result = build_filters_response("used", 50.0, 200.0, "price_asc")

        assert result["condition"] == "used"
        assert result["min_price"] == 50.0
        assert result["max_price"] == 200.0
        assert result["sort"] == "price_asc"

    def test_build_with_no_filters(self):
        """Test building response with no filters."""
        result = build_filters_response(None, None, None, None)
        assert result is None

    def test_build_with_partial_filters(self):
        """Test building response with partial filters."""
        result = build_filters_response("new", None, 100.0, None)

        assert result["condition"] == "new"
        assert result["max_price"] == 100.0
        assert "min_price" not in result
        assert "sort" not in result


class TestHealthEndpoint:
    """Tests for the /health endpoint."""

    def test_health_check(self, client):
        """Test health endpoint returns healthy status."""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "healthy"
        assert "ebay_configured" in data


class TestIndexEndpoint:
    """Tests for the / endpoint."""

    def test_index_returns_api_info(self, client):
        """Test index endpoint returns API information."""
        response = client.get("/")

        assert response.status_code == 200
        data = response.get_json()
        assert data["name"] == "Snout"
        assert "endpoints" in data
        assert "filters" in data
        assert "sort_options" in data


class TestSearchEndpoints:
    """Tests for search endpoints with mocked eBay API."""

    @patch("app.requests.get")
    @patch("app.EBAY_APP_ID", "test_app_id")
    def test_search_sold_success(self, mock_get, client, mock_ebay_sold_response):
        """Test successful sold items search."""
        mock_response = MagicMock()
        mock_response.json.return_value = mock_ebay_sold_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        response = client.get("/search/sold?q=nintendo+switch")

        assert response.status_code == 200
        data = response.get_json()
        assert data["query"] == "nintendo switch"
        assert data["type"] == "sold"
        assert len(data["items"]) == 3
        assert data["stats"]["count"] == 3

    @patch("app.requests.get")
    @patch("app.EBAY_APP_ID", "test_app_id")
    def test_search_active_success(self, mock_get, client, mock_ebay_active_response):
        """Test successful active items search."""
        mock_response = MagicMock()
        mock_response.json.return_value = mock_ebay_active_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        response = client.get("/search/active?q=nintendo+switch")

        assert response.status_code == 200
        data = response.get_json()
        assert data["query"] == "nintendo switch"
        assert data["type"] == "active"
        assert len(data["items"]) == 2

    def test_search_sold_missing_query(self, client):
        """Test sold search returns error when query is missing."""
        response = client.get("/search/sold")

        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data
        assert "Missing required parameter" in data["error"]

    def test_search_active_missing_query(self, client):
        """Test active search returns error when query is missing."""
        response = client.get("/search/active")

        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    @patch("app.EBAY_APP_ID", None)
    def test_search_sold_no_api_key(self, client):
        """Test sold search returns error when API key is not configured."""
        response = client.get("/search/sold?q=test")

        assert response.status_code == 500
        data = response.get_json()
        assert "EBAY_APP_ID not configured" in data["error"]

    @patch("app.requests.get")
    @patch("app.EBAY_APP_ID", "test_app_id")
    def test_search_with_filters(self, mock_get, client, mock_ebay_sold_response):
        """Test search with condition and price filters."""
        mock_response = MagicMock()
        mock_response.json.return_value = mock_ebay_sold_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        response = client.get(
            "/search/sold?q=nintendo+switch&condition=used&min_price=100&max_price=500"
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data["filters"]["condition"] == "used"
        assert data["filters"]["min_price"] == 100.0
        assert data["filters"]["max_price"] == 500.0


class TestCompareEndpoint:
    """Tests for the /search/compare endpoint."""

    @patch("app.requests.get")
    @patch("app.EBAY_APP_ID", "test_app_id")
    def test_compare_prices_success(
        self, mock_get, client, mock_ebay_sold_response, mock_ebay_active_response
    ):
        """Test successful price comparison."""
        mock_response_sold = MagicMock()
        mock_response_sold.json.return_value = mock_ebay_sold_response
        mock_response_sold.raise_for_status = MagicMock()

        mock_response_active = MagicMock()
        mock_response_active.json.return_value = mock_ebay_active_response
        mock_response_active.raise_for_status = MagicMock()

        mock_get.side_effect = [mock_response_sold, mock_response_active]

        response = client.get("/search/compare?q=nintendo+switch")

        assert response.status_code == 200
        data = response.get_json()
        assert data["query"] == "nintendo switch"
        assert "sold" in data
        assert "active" in data
        assert "comparison" in data
        assert data["comparison"]["recommendation"] in ["underpriced", "overpriced", "fair"]

    def test_compare_missing_query(self, client):
        """Test compare returns error when query is missing."""
        response = client.get("/search/compare")

        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data


class TestConditionMap:
    """Tests for condition mapping constants."""

    def test_condition_map_values(self):
        """Test condition map contains expected values."""
        assert "new" in CONDITION_MAP
        assert "used" in CONDITION_MAP
        assert CONDITION_MAP["new"] == "1000"
        assert CONDITION_MAP["used"] == "3000"


class TestSortMap:
    """Tests for sort order mapping constants."""

    def test_sort_map_values(self):
        """Test sort map contains expected values."""
        assert "best_match" in SORT_MAP
        assert "price_asc" in SORT_MAP
        assert "price_desc" in SORT_MAP
        assert SORT_MAP["best_match"] == "BestMatch"
