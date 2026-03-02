"""
Snout - eBay Reseller Price Lookup API
"""
import logging
import os
from dataclasses import asdict

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from .config import BROWSE_CONDITION_MAP, BROWSE_SORT_MAP, CONDITION_MAP, SORT_MAP, Config, setup_logging
from .services import EbayFindingService, calculate_price_stats
from .services.auth_service import AuthError, EbayAuthService
from .services.ebay_browse_service import BrowseApiError, BrowseSearchQuery, EbayBrowseService
from .services.ebay_service import EbayApiError, SearchQuery
from .services.price_analyzer import compare_prices
from .utils.validators import ValidationError, validate_keywords, validate_price

# Initialize logging
logger = setup_logging(
    level=logging.DEBUG if os.environ.get("FLASK_DEBUG") else logging.INFO
)

# Load configuration
config = Config.from_env()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=[config.rate_limit_default],
    storage_uri="memory://",
)

# Initialize eBay services
ebay_service = EbayFindingService(config)

# Initialize Browse API service (requires both app_id and cert_id)
browse_service = None
if config.ebay_app_id and config.ebay_cert_id:
    auth_service = EbayAuthService(config.ebay_app_id, config.ebay_cert_id, config.ebay_token_endpoint)
    browse_service = EbayBrowseService(config, auth_service)


def parse_filter_params() -> dict:
    """Parse common filter parameters from request args."""
    condition = request.args.get("condition")
    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)
    sort = request.args.get("sort")

    # Validate prices
    min_price = validate_price(min_price, "min_price")
    max_price = validate_price(max_price, "max_price")

    return {
        "condition": condition,
        "min_price": min_price,
        "max_price": max_price,
        "sort": sort,
    }


def build_filters_response(
    condition: str | None,
    min_price: float | None,
    max_price: float | None,
    sort: str | None = None,
) -> dict | None:
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


def items_to_dicts(items) -> list[dict]:
    """Convert EbayItem objects to dictionaries."""
    result = []
    for item in items:
        d = {
            "title": item.title,
            "price": item.price,
            "currency": item.currency,
            "item_id": item.item_id,
            "url": item.url,
            "condition": item.condition,
            "listing_type": item.listing_type,
        }
        if item.sold_date:
            d["sold_date"] = item.sold_date
        result.append(d)
    return result


def browse_items_to_dicts(items) -> list[dict]:
    """Convert BrowseItem objects to dictionaries."""
    return [asdict(item) for item in items]


def execute_search(keywords: str, sold: bool, filters: dict) -> tuple[dict, int]:
    """
    Execute a search using the Finding API and return the response.

    Args:
        keywords: Search keywords
        sold: Whether to search sold items
        filters: Filter parameters

    Returns:
        Tuple of (response_dict, status_code)
    """
    query = SearchQuery(
        keywords=keywords,
        sold=sold,
        condition=filters["condition"],
        min_price=filters["min_price"],
        max_price=filters["max_price"],
        sort=filters["sort"],
    )

    items = ebay_service.search(query)
    stats = calculate_price_stats(items)

    return {
        "query": keywords,
        "type": "sold" if sold else "active",
        "filters": build_filters_response(
            filters["condition"],
            filters["min_price"],
            filters["max_price"],
            filters["sort"],
        ),
        "stats": stats.to_dict() if stats else None,
        "items": items_to_dicts(items),
    }, 200


@app.errorhandler(ValidationError)
def handle_validation_error(error: ValidationError):
    """Handle validation errors."""
    logger.warning("Validation error: %s", error.message)
    return jsonify({"error": error.message, "field": error.field}), 400


@app.errorhandler(EbayApiError)
def handle_ebay_error(error: EbayApiError):
    """Handle eBay Finding API errors."""
    logger.error("eBay API error: %s", str(error))
    return jsonify({"error": "Failed to fetch data from eBay"}), 502


@app.errorhandler(BrowseApiError)
def handle_browse_error(error: BrowseApiError):
    """Handle eBay Browse API errors."""
    logger.error("Browse API error: %s", str(error))
    return jsonify({"error": "Failed to fetch data from eBay Browse API"}), 502


@app.errorhandler(AuthError)
def handle_auth_error(error: AuthError):
    """Handle eBay auth errors."""
    logger.error("Auth error: %s", str(error))
    return jsonify({"error": "eBay authentication failed"}), 502


# ─── Browse API endpoint (new) ──────────────────────────────────────────────

@app.route("/api/search")
@limiter.limit(config.rate_limit_search)
def api_search():
    """
    Search active eBay listings via Browse API.

    Query params:
        q: Search keywords (required)
        condition: Filter by condition (new, open_box, refurbished, used, for_parts)
        min_price: Minimum price filter
        max_price: Maximum price filter
        sort: Sort order (best_match, price_asc, price_desc, date_asc, date_desc)
        limit: Results per page (default 50, max 200)
        offset: Pagination offset (default 0)
    """
    if not browse_service:
        return jsonify({"error": "eBay Browse API not configured (need APP_ID + CERT_ID)"}), 500

    keywords = validate_keywords(
        request.args.get("q"),
        max_length=config.max_keyword_length,
    )

    filters = parse_filter_params()
    limit = min(request.args.get("limit", 50, type=int), 200)
    offset = request.args.get("offset", 0, type=int)

    logger.info("Browse search: keywords=%s, filters=%s", keywords, filters)

    query = BrowseSearchQuery(
        keywords=keywords,
        condition=filters["condition"],
        min_price=filters["min_price"],
        max_price=filters["max_price"],
        sort=filters["sort"],
        marketplace=config.default_marketplace,
        limit=limit,
        offset=offset,
    )

    items = browse_service.search(query)

    # Calculate stats using total_price
    prices = [item.total_price for item in items if item.total_price > 0]
    stats = None
    if prices:
        import statistics
        stats = {
            "count": len(prices),
            "average": round(statistics.mean(prices), 2),
            "median": round(statistics.median(prices), 2),
            "min": round(min(prices), 2),
            "max": round(max(prices), 2),
            "std_dev": round(statistics.stdev(prices), 2) if len(prices) > 1 else 0,
        }

    return jsonify({
        "query": keywords,
        "filters": build_filters_response(
            filters["condition"],
            filters["min_price"],
            filters["max_price"],
            filters["sort"],
        ),
        "stats": stats,
        "items": browse_items_to_dicts(items),
        "pagination": {
            "limit": limit,
            "offset": offset,
            "returned": len(items),
        },
    })


# ─── Legacy Finding API endpoints ───────────────────────────────────────────

@app.route("/")
def index():
    """API info endpoint."""
    return jsonify({
        "name": "Snout",
        "description": "eBay Reseller Price Lookup API",
        "version": "2.0.0",
        "endpoints": {
            "/api/search": "Search active listings (Browse API)",
            "/search/sold": "[Legacy] Search sold/completed listings (Finding API)",
            "/search/active": "[Legacy] Search active listings (Finding API)",
            "/search/compare": "[Legacy] Compare sold vs active prices (Finding API)",
            "/config/status": "Check credential configuration status",
            "/health": "Health check",
        },
        "filters": {
            "condition": list(BROWSE_CONDITION_MAP.keys()),
            "min_price": "Minimum price (float)",
            "max_price": "Maximum price (float)",
        },
        "sort_options": list(BROWSE_SORT_MAP.keys()),
    })


@app.route("/search/sold")
@limiter.limit(config.rate_limit_search)
def search_sold():
    """
    [Legacy] Search for sold/completed eBay listings via Finding API.

    Query params:
        q: Search keywords (required)
        condition: Filter by condition (new, open_box, refurbished, used, for_parts)
        min_price: Minimum price filter
        max_price: Maximum price filter
        sort: Sort order (best_match, price_asc, price_desc, date_asc, date_desc)
    """
    keywords = validate_keywords(
        request.args.get("q"),
        max_length=config.max_keyword_length,
    )

    if not config.is_ebay_configured:
        return jsonify({"error": "eBay API not configured"}), 500

    filters = parse_filter_params()
    logger.info("Search sold: keywords=%s, filters=%s", keywords, filters)

    response, status = execute_search(keywords, sold=True, filters=filters)
    return jsonify(response), status


@app.route("/search/active")
@limiter.limit(config.rate_limit_search)
def search_active():
    """
    [Legacy] Search for active eBay listings via Finding API.

    Query params:
        q: Search keywords (required)
        condition: Filter by condition (new, open_box, refurbished, used, for_parts)
        min_price: Minimum price filter
        max_price: Maximum price filter
        sort: Sort order (best_match, price_asc, price_desc, date_asc, date_desc)
    """
    keywords = validate_keywords(
        request.args.get("q"),
        max_length=config.max_keyword_length,
    )

    if not config.is_ebay_configured:
        return jsonify({"error": "eBay API not configured"}), 500

    filters = parse_filter_params()
    logger.info("Search active: keywords=%s, filters=%s", keywords, filters)

    response, status = execute_search(keywords, sold=False, filters=filters)
    return jsonify(response), status


@app.route("/search/compare")
@limiter.limit(config.rate_limit_search)
def compare_prices_endpoint():
    """
    [Legacy] Compare sold vs active prices via Finding API.

    Query params:
        q: Search keywords (required)
        condition: Filter by condition (new, open_box, refurbished, used, for_parts)
        min_price: Minimum price filter
        max_price: Maximum price filter
    """
    keywords = validate_keywords(
        request.args.get("q"),
        max_length=config.max_keyword_length,
    )

    if not config.is_ebay_configured:
        return jsonify({"error": "eBay API not configured"}), 500

    filters = parse_filter_params()
    logger.info("Compare prices: keywords=%s, filters=%s", keywords, filters)

    # Build queries for concurrent execution
    sold_query = SearchQuery(
        keywords=keywords,
        sold=True,
        condition=filters["condition"],
        min_price=filters["min_price"],
        max_price=filters["max_price"],
        sort=filters["sort"],
    )
    active_query = SearchQuery(
        keywords=keywords,
        sold=False,
        condition=filters["condition"],
        min_price=filters["min_price"],
        max_price=filters["max_price"],
        sort=filters["sort"],
    )

    # Execute searches concurrently
    sold_items, active_items = ebay_service.search_concurrent(sold_query, active_query)

    sold_stats = calculate_price_stats(sold_items)
    active_stats = calculate_price_stats(active_items)
    comparison = compare_prices(sold_stats, active_stats)

    return jsonify({
        "query": keywords,
        "filters": build_filters_response(
            filters["condition"],
            filters["min_price"],
            filters["max_price"],
        ),
        "sold": {
            "stats": sold_stats.to_dict() if sold_stats else None,
            "sample_count": len(sold_items),
        },
        "active": {
            "stats": active_stats.to_dict() if active_stats else None,
            "sample_count": len(active_items),
        },
        "comparison": comparison.to_dict() if comparison else None,
    })


@app.route("/health")
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "ebay_configured": config.is_ebay_configured,
        "browse_api_configured": browse_service is not None,
    })


@app.route("/config/status")
def config_status():
    """
    Get configuration status showing which credentials are configured.

    Returns credential status without exposing actual values.
    For local development use only.
    """
    credentials = config.get_credentials_status(include_masked=True)

    return jsonify({
        "credentials": credentials,
        "summary": {
            "all_configured": all(c["configured"] for c in credentials.values()),
            "ebay_ready": config.is_ebay_configured,
            "browse_api_ready": browse_service is not None,
            "configured_count": sum(1 for c in credentials.values() if c["configured"]),
            "total_count": len(credentials),
        },
    })


def create_app(test_config: Config | None = None) -> Flask:
    """Application factory for testing."""
    global config, ebay_service

    if test_config:
        config = test_config
        ebay_service = EbayFindingService(config)

    return app


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
