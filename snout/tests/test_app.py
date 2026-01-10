"""Tests for Snout API."""
import pytest
from unittest.mock import patch, MagicMock
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import build_filters_response
from config import CONDITION_MAP, SORT_MAP, Config
from services.ebay_service import EbayFindingService, EbayItem, SearchQuery
from services.price_analyzer import calculate_price_stats, PriceStats


class TestParseResults:
    """Tests for EbayFindingService._parse_results method."""

    @pytest.fixture
    def service(self):
        """Create a service instance with mock config."""
        config = Config(
            ebay_app_id="test_app_id",
            ebay_cert_id=None,
            ebay_oauth_token=None,
        )
        return EbayFindingService(config)

    def test_parse_sold_items(self, service, mock_ebay_sold_response):
        """Test parsing sold items from eBay response."""
        results = service._parse_results(mock_ebay_sold_response, sold=True)

        assert len(results) == 3
        assert results[0].title == "Nintendo Switch Console"
        assert results[0].price == 250.00
        assert results[0].currency == "USD"
        assert results[0].item_id == "123456789"
        assert results[0].sold_date is not None

    def test_parse_active_items(self, service, mock_ebay_active_response):
        """Test parsing active items from eBay response."""
        results = service._parse_results(mock_ebay_active_response, sold=False)

        assert len(results) == 2
        assert results[0].title == "Nintendo Switch Console New"
        assert results[0].price == 320.00
        assert results[0].sold_date is None

    def test_parse_empty_response(self, service, mock_ebay_empty_response):
        """Test parsing empty response."""
        results = service._parse_results(mock_ebay_empty_response, sold=False)
        assert results == []

    def test_parse_invalid_response(self, service):
        """Test parsing invalid/missing response."""
        results = service._parse_results({}, sold=False)
        assert results == []

    def test_parse_failed_response(self, service):
        """Test parsing a failed API response."""
        data = {
            "findItemsByKeywordsResponse": [{
                "ack": ["Failure"],
                "errorMessage": [{"error": [{"message": ["Invalid request"]}]}]
            }]
        }
        results = service._parse_results(data, sold=False)
        assert results == []


class TestCalculatePriceStats:
    """Tests for calculate_price_stats function."""

    def _make_items(self, prices: list[float]) -> list[EbayItem]:
        """Helper to create EbayItem objects with given prices."""
        return [
            EbayItem(
                title=f"Item {i}",
                price=price,
                currency="USD",
                item_id=str(i),
                url=f"https://ebay.com/{i}",
                condition="Used",
                listing_type="FixedPrice",
            )
            for i, price in enumerate(prices)
        ]

    def test_calculate_stats_multiple_items(self):
        """Test calculating stats with multiple items."""
        items = self._make_items([100.00, 200.00, 300.00])
        stats = calculate_price_stats(items)

        assert stats is not None
        assert stats.count == 3
        assert stats.average == 200.00
        assert stats.median == 200.00
        assert stats.min == 100.00
        assert stats.max == 300.00
        assert stats.std_dev == 100.00

    def test_calculate_stats_single_item(self):
        """Test calculating stats with a single item."""
        items = self._make_items([150.00])
        stats = calculate_price_stats(items)

        assert stats is not None
        assert stats.count == 1
        assert stats.average == 150.00
        assert stats.median == 150.00
        assert stats.std_dev == 0

    def test_calculate_stats_empty_list(self):
        """Test calculating stats with empty list."""
        stats = calculate_price_stats([])
        assert stats is None

    def test_calculate_stats_zero_prices(self):
        """Test that zero prices are filtered out."""
        items = self._make_items([100.00, 0, 200.00])
        stats = calculate_price_stats(items)

        assert stats is not None
        assert stats.count == 2
        assert stats.average == 150.00


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

    @patch("app.ebay_service")
    @patch("app.config")
    def test_search_sold_success(
        self, mock_config, mock_service, client, mock_ebay_sold_response
    ):
        """Test successful sold items search."""
        # Configure the mocks
        mock_config.is_ebay_configured = True
        mock_config.max_keyword_length = 1000

        # Create mock EbayItem objects
        mock_items = [
            EbayItem(
                title="Nintendo Switch Console",
                price=250.00,
                currency="USD",
                item_id="123456789",
                url="https://ebay.com/123456789",
                condition="Used",
                listing_type="Auction",
                sold_date="2024-01-15T10:30:00.000Z",
            ),
            EbayItem(
                title="Nintendo Switch with Games",
                price=300.00,
                currency="USD",
                item_id="987654321",
                url="https://ebay.com/987654321",
                condition="Used",
                listing_type="FixedPrice",
                sold_date="2024-01-14T08:00:00.000Z",
            ),
            EbayItem(
                title="Nintendo Switch Lite",
                price=180.00,
                currency="USD",
                item_id="555555555",
                url="https://ebay.com/555555555",
                condition="New",
                listing_type="FixedPrice",
                sold_date="2024-01-13T12:00:00.000Z",
            ),
        ]
        mock_service.search.return_value = mock_items

        response = client.get("/search/sold?q=nintendo+switch")

        assert response.status_code == 200
        data = response.get_json()
        assert data["query"] == "nintendo switch"
        assert data["type"] == "sold"
        assert len(data["items"]) == 3
        assert data["stats"]["count"] == 3

    @patch("app.ebay_service")
    @patch("app.config")
    def test_search_active_success(self, mock_config, mock_service, client):
        """Test successful active items search."""
        mock_config.is_ebay_configured = True
        mock_config.max_keyword_length = 1000

        mock_items = [
            EbayItem(
                title="Nintendo Switch Console New",
                price=320.00,
                currency="USD",
                item_id="111111111",
                url="https://ebay.com/111111111",
                condition="New",
                listing_type="FixedPrice",
            ),
            EbayItem(
                title="Nintendo Switch Bundle",
                price=280.00,
                currency="USD",
                item_id="222222222",
                url="https://ebay.com/222222222",
                condition="Used",
                listing_type="Auction",
            ),
        ]
        mock_service.search.return_value = mock_items

        response = client.get("/search/active?q=nintendo+switch")

        assert response.status_code == 200
        data = response.get_json()
        assert data["query"] == "nintendo switch"
        assert data["type"] == "active"
        assert len(data["items"]) == 2

    @patch("app.config")
    def test_search_sold_no_api_key(self, mock_config, client):
        """Test sold search returns error when API key is not configured."""
        mock_config.is_ebay_configured = False
        mock_config.max_keyword_length = 1000

        response = client.get("/search/sold?q=test")

        assert response.status_code == 500
        data = response.get_json()
        assert "not configured" in data["error"]

    @patch("app.ebay_service")
    @patch("app.config")
    def test_search_with_filters(self, mock_config, mock_service, client):
        """Test search with condition and price filters."""
        mock_config.is_ebay_configured = True
        mock_config.max_keyword_length = 1000

        mock_items = [
            EbayItem(
                title="Nintendo Switch",
                price=250.00,
                currency="USD",
                item_id="123",
                url="https://ebay.com/123",
                condition="Used",
                listing_type="Auction",
                sold_date="2024-01-15",
            ),
        ]
        mock_service.search.return_value = mock_items

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

    @patch("app.ebay_service")
    @patch("app.config")
    def test_compare_prices_success(self, mock_config, mock_service, client):
        """Test successful price comparison."""
        mock_config.is_ebay_configured = True
        mock_config.max_keyword_length = 1000

        sold_items = [
            EbayItem(
                title="Nintendo Switch",
                price=250.00,
                currency="USD",
                item_id="1",
                url="https://ebay.com/1",
                condition="Used",
                listing_type="Auction",
                sold_date="2024-01-15",
            ),
            EbayItem(
                title="Nintendo Switch",
                price=300.00,
                currency="USD",
                item_id="2",
                url="https://ebay.com/2",
                condition="Used",
                listing_type="FixedPrice",
                sold_date="2024-01-14",
            ),
        ]
        active_items = [
            EbayItem(
                title="Nintendo Switch",
                price=320.00,
                currency="USD",
                item_id="3",
                url="https://ebay.com/3",
                condition="New",
                listing_type="FixedPrice",
            ),
        ]
        mock_service.search_concurrent.return_value = (sold_items, active_items)

        response = client.get("/search/compare?q=nintendo+switch")

        assert response.status_code == 200
        data = response.get_json()
        assert data["query"] == "nintendo switch"
        assert "sold" in data
        assert "active" in data
        assert "comparison" in data
        assert data["comparison"]["recommendation"] in [
            "underpriced",
            "overpriced",
            "fair",
        ]

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
