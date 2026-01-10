"""
Snout - eBay Reseller Price Lookup API
"""
import os
import statistics
from flask import Flask, jsonify, request
import requests
from functools import lru_cache
from datetime import datetime, timedelta

app = Flask(__name__)

# eBay API Configuration
EBAY_APP_ID = os.environ.get("EBAY_APP_ID")
EBAY_CERT_ID = os.environ.get("EBAY_CERT_ID")
EBAY_OAUTH_TOKEN = os.environ.get("EBAY_OAUTH_TOKEN")

# eBay API endpoints
EBAY_FINDING_API = "https://svcs.ebay.com/services/search/FindingService/v1"
EBAY_BROWSE_API = "https://api.ebay.com/buy/browse/v1"

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


def get_oauth_token():
    """Get OAuth token from environment or fetch a new one."""
    if EBAY_OAUTH_TOKEN:
        return EBAY_OAUTH_TOKEN
    return None


def search_ebay_finding_api(keywords, sold=False, condition=None, min_price=None, max_price=None, sort=None):
    """
    Search eBay using the Finding API.
    Set sold=True to search completed/sold listings.
    """
    operation = "findCompletedItems" if sold else "findItemsByKeywords"

    params = {
        "OPERATION-NAME": operation,
        "SERVICE-VERSION": "1.0.0",
        "SECURITY-APPNAME": EBAY_APP_ID,
        "RESPONSE-DATA-FORMAT": "JSON",
        "REST-PAYLOAD": "",
        "keywords": keywords,
        "paginationInput.entriesPerPage": "100",
    }

    # Sort order
    if sort and sort.lower() in SORT_MAP:
        params["sortOrder"] = SORT_MAP[sort.lower()]

    filter_index = 0

    if sold:
        # Filter for sold items only (not just ended)
        params[f"itemFilter({filter_index}).name"] = "SoldItemsOnly"
        params[f"itemFilter({filter_index}).value"] = "true"
        filter_index += 1

    # Condition filter
    if condition and condition.lower() in CONDITION_MAP:
        params[f"itemFilter({filter_index}).name"] = "Condition"
        params[f"itemFilter({filter_index}).value"] = CONDITION_MAP[condition.lower()]
        filter_index += 1

    # Price range filters
    if min_price is not None:
        params[f"itemFilter({filter_index}).name"] = "MinPrice"
        params[f"itemFilter({filter_index}).value"] = str(min_price)
        filter_index += 1

    if max_price is not None:
        params[f"itemFilter({filter_index}).name"] = "MaxPrice"
        params[f"itemFilter({filter_index}).value"] = str(max_price)
        filter_index += 1

    response = requests.get(EBAY_FINDING_API, params=params, timeout=30)
    response.raise_for_status()
    return response.json()


def parse_finding_results(data, sold=False):
    """Parse results from the Finding API."""
    results = []

    response_key = "findCompletedItemsResponse" if sold else "findItemsByKeywordsResponse"

    if response_key not in data:
        return results

    response = data[response_key][0]

    if response.get("ack", [None])[0] != "Success":
        return results

    search_result = response.get("searchResult", [{}])[0]
    items = search_result.get("item", [])

    for item in items:
        try:
            price_info = item.get("sellingStatus", [{}])[0]
            current_price = price_info.get("currentPrice", [{}])[0]

            result = {
                "title": item.get("title", [""])[0],
                "price": float(current_price.get("__value__", 0)),
                "currency": current_price.get("@currencyId", "USD"),
                "item_id": item.get("itemId", [""])[0],
                "url": item.get("viewItemURL", [""])[0],
                "condition": item.get("condition", [{}])[0].get("conditionDisplayName", ["Unknown"])[0] if item.get("condition") else "Unknown",
                "listing_type": item.get("listingInfo", [{}])[0].get("listingType", ["Unknown"])[0],
            }

            if sold:
                end_time = item.get("listingInfo", [{}])[0].get("endTime", [""])[0]
                result["sold_date"] = end_time

            results.append(result)
        except (KeyError, IndexError, ValueError):
            continue

    return results


def calculate_price_stats(items):
    """Calculate price statistics from a list of items."""
    if not items:
        return None

    prices = [item["price"] for item in items if item["price"] > 0]

    if not prices:
        return None

    return {
        "count": len(prices),
        "average": round(statistics.mean(prices), 2),
        "median": round(statistics.median(prices), 2),
        "min": round(min(prices), 2),
        "max": round(max(prices), 2),
        "std_dev": round(statistics.stdev(prices), 2) if len(prices) > 1 else 0,
    }


def parse_filter_params():
    """Parse common filter parameters from request args."""
    condition = request.args.get("condition")
    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)
    sort = request.args.get("sort")

    return {
        "condition": condition,
        "min_price": min_price,
        "max_price": max_price,
        "sort": sort,
    }


def build_filters_response(condition, min_price, max_price, sort=None):
    """Build filters dict for response."""
    filters = {}
    if condition:
        filters["condition"] = condition
    if min_price is not None:
        filters["min_price"] = min_price
    if max_price is not None:
        filters["max_price"] = max_price
    if sort:
        filters["sort"] = sort
    return filters if filters else None


@app.route("/")
def index():
    """API info endpoint."""
    return jsonify({
        "name": "Snout",
        "description": "eBay Reseller Price Lookup API",
        "version": "1.0.0",
        "endpoints": {
            "/search/sold": "Search sold/completed listings",
            "/search/active": "Search active listings",
            "/search/compare": "Compare sold vs active prices",
        },
        "filters": {
            "condition": list(CONDITION_MAP.keys()),
            "min_price": "Minimum price (float)",
            "max_price": "Maximum price (float)",
        },
        "sort_options": list(SORT_MAP.keys()),
    })


@app.route("/search/sold")
def search_sold():
    """
    Search for sold/completed eBay listings.

    Query params:
        q: Search keywords (required)
        condition: Filter by condition (new, open_box, refurbished, used, for_parts)
        min_price: Minimum price filter
        max_price: Maximum price filter
        sort: Sort order (best_match, price_asc, price_desc, date_asc, date_desc)
    """
    keywords = request.args.get("q")

    if not keywords:
        return jsonify({"error": "Missing required parameter: q"}), 400

    if not EBAY_APP_ID:
        return jsonify({"error": "EBAY_APP_ID not configured"}), 500

    filters = parse_filter_params()

    try:
        data = search_ebay_finding_api(
            keywords,
            sold=True,
            condition=filters["condition"],
            min_price=filters["min_price"],
            max_price=filters["max_price"],
            sort=filters["sort"],
        )
        items = parse_finding_results(data, sold=True)
        stats = calculate_price_stats(items)

        return jsonify({
            "query": keywords,
            "type": "sold",
            "filters": build_filters_response(filters["condition"], filters["min_price"], filters["max_price"], filters["sort"]),
            "stats": stats,
            "items": items,
        })
    except requests.RequestException as e:
        return jsonify({"error": f"eBay API error: {str(e)}"}), 502


@app.route("/search/active")
def search_active():
    """
    Search for active eBay listings.

    Query params:
        q: Search keywords (required)
        condition: Filter by condition (new, open_box, refurbished, used, for_parts)
        min_price: Minimum price filter
        max_price: Maximum price filter
        sort: Sort order (best_match, price_asc, price_desc, date_asc, date_desc)
    """
    keywords = request.args.get("q")

    if not keywords:
        return jsonify({"error": "Missing required parameter: q"}), 400

    if not EBAY_APP_ID:
        return jsonify({"error": "EBAY_APP_ID not configured"}), 500

    filters = parse_filter_params()

    try:
        data = search_ebay_finding_api(
            keywords,
            sold=False,
            condition=filters["condition"],
            min_price=filters["min_price"],
            max_price=filters["max_price"],
            sort=filters["sort"],
        )
        items = parse_finding_results(data, sold=False)
        stats = calculate_price_stats(items)

        return jsonify({
            "query": keywords,
            "type": "active",
            "filters": build_filters_response(filters["condition"], filters["min_price"], filters["max_price"], filters["sort"]),
            "stats": stats,
            "items": items,
        })
    except requests.RequestException as e:
        return jsonify({"error": f"eBay API error: {str(e)}"}), 502


@app.route("/search/compare")
def compare_prices():
    """
    Compare sold vs active prices for the same search.

    Query params:
        q: Search keywords (required)
        condition: Filter by condition (new, open_box, refurbished, used, for_parts)
        min_price: Minimum price filter
        max_price: Maximum price filter
    """
    keywords = request.args.get("q")

    if not keywords:
        return jsonify({"error": "Missing required parameter: q"}), 400

    if not EBAY_APP_ID:
        return jsonify({"error": "EBAY_APP_ID not configured"}), 500

    filters = parse_filter_params()

    try:
        # Fetch both sold and active listings
        sold_data = search_ebay_finding_api(
            keywords,
            sold=True,
            condition=filters["condition"],
            min_price=filters["min_price"],
            max_price=filters["max_price"],
        )
        active_data = search_ebay_finding_api(
            keywords,
            sold=False,
            condition=filters["condition"],
            min_price=filters["min_price"],
            max_price=filters["max_price"],
        )

        sold_items = parse_finding_results(sold_data, sold=True)
        active_items = parse_finding_results(active_data, sold=False)

        sold_stats = calculate_price_stats(sold_items)
        active_stats = calculate_price_stats(active_items)

        # Calculate price difference if both have data
        comparison = None
        if sold_stats and active_stats:
            avg_diff = active_stats["average"] - sold_stats["average"]
            comparison = {
                "avg_price_difference": round(avg_diff, 2),
                "avg_price_difference_percent": round((avg_diff / sold_stats["average"]) * 100, 1) if sold_stats["average"] else 0,
                "recommendation": "underpriced" if avg_diff < 0 else "overpriced" if avg_diff > 0 else "fair",
            }

        return jsonify({
            "query": keywords,
            "filters": build_filters_response(filters["condition"], filters["min_price"], filters["max_price"]),
            "sold": {
                "stats": sold_stats,
                "sample_count": len(sold_items),
            },
            "active": {
                "stats": active_stats,
                "sample_count": len(active_items),
            },
            "comparison": comparison,
        })
    except requests.RequestException as e:
        return jsonify({"error": f"eBay API error: {str(e)}"}), 502


@app.route("/health")
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "ebay_configured": bool(EBAY_APP_ID),
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
