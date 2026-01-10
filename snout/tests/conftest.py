"""Pytest fixtures for Snout API tests."""
import pytest
import os
import sys

# Add the parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app as flask_app


@pytest.fixture
def app():
    """Create application for testing."""
    flask_app.config.update({
        "TESTING": True,
    })
    yield flask_app


@pytest.fixture
def client(app):
    """Create a test client for the app."""
    return app.test_client()


@pytest.fixture
def mock_ebay_sold_response():
    """Mock response for eBay Finding API sold items search."""
    return {
        "findCompletedItemsResponse": [{
            "ack": ["Success"],
            "searchResult": [{
                "@count": "3",
                "item": [
                    {
                        "itemId": ["123456789"],
                        "title": ["Nintendo Switch Console"],
                        "viewItemURL": ["https://www.ebay.com/itm/123456789"],
                        "condition": [{"conditionDisplayName": ["Used"]}],
                        "sellingStatus": [{
                            "currentPrice": [{"@currencyId": "USD", "__value__": "250.00"}]
                        }],
                        "listingInfo": [{
                            "listingType": ["Auction"],
                            "endTime": ["2024-01-15T10:30:00.000Z"]
                        }]
                    },
                    {
                        "itemId": ["987654321"],
                        "title": ["Nintendo Switch with Games"],
                        "viewItemURL": ["https://www.ebay.com/itm/987654321"],
                        "condition": [{"conditionDisplayName": ["Used"]}],
                        "sellingStatus": [{
                            "currentPrice": [{"@currencyId": "USD", "__value__": "300.00"}]
                        }],
                        "listingInfo": [{
                            "listingType": ["FixedPrice"],
                            "endTime": ["2024-01-14T08:00:00.000Z"]
                        }]
                    },
                    {
                        "itemId": ["555555555"],
                        "title": ["Nintendo Switch Lite"],
                        "viewItemURL": ["https://www.ebay.com/itm/555555555"],
                        "condition": [{"conditionDisplayName": ["New"]}],
                        "sellingStatus": [{
                            "currentPrice": [{"@currencyId": "USD", "__value__": "180.00"}]
                        }],
                        "listingInfo": [{
                            "listingType": ["FixedPrice"],
                            "endTime": ["2024-01-13T12:00:00.000Z"]
                        }]
                    }
                ]
            }]
        }]
    }


@pytest.fixture
def mock_ebay_active_response():
    """Mock response for eBay Finding API active items search."""
    return {
        "findItemsByKeywordsResponse": [{
            "ack": ["Success"],
            "searchResult": [{
                "@count": "2",
                "item": [
                    {
                        "itemId": ["111111111"],
                        "title": ["Nintendo Switch Console New"],
                        "viewItemURL": ["https://www.ebay.com/itm/111111111"],
                        "condition": [{"conditionDisplayName": ["New"]}],
                        "sellingStatus": [{
                            "currentPrice": [{"@currencyId": "USD", "__value__": "320.00"}]
                        }],
                        "listingInfo": [{
                            "listingType": ["FixedPrice"]
                        }]
                    },
                    {
                        "itemId": ["222222222"],
                        "title": ["Nintendo Switch Bundle"],
                        "viewItemURL": ["https://www.ebay.com/itm/222222222"],
                        "condition": [{"conditionDisplayName": ["Used"]}],
                        "sellingStatus": [{
                            "currentPrice": [{"@currencyId": "USD", "__value__": "280.00"}]
                        }],
                        "listingInfo": [{
                            "listingType": ["Auction"]
                        }]
                    }
                ]
            }]
        }]
    }


@pytest.fixture
def mock_ebay_empty_response():
    """Mock response for eBay Finding API with no results."""
    return {
        "findItemsByKeywordsResponse": [{
            "ack": ["Success"],
            "searchResult": [{
                "@count": "0",
                "item": []
            }]
        }]
    }
