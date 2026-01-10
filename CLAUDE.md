# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Snout is a Python Flask REST API for eBay price analysis. It helps resellers compare sold vs active listing prices to make informed pricing decisions.

## Commands

```bash
# Install dependencies
pip install -r snout/requirements.txt

# Run the server (default port 5000)
python snout/app.py

# Run with custom port
PORT=8080 python snout/app.py

# Run with debug mode
FLASK_DEBUG=true python snout/app.py
```

## Environment Setup

Copy `snout/.env.example` to `snout/.env` and configure:
- `EBAY_APP_ID` - Required. Get from https://developer.ebay.com/
- `EBAY_CERT_ID` - eBay certificate ID
- `EBAY_OAUTH_TOKEN` - OAuth token for authentication

## Architecture

This is a single-file Flask application (`snout/app.py`) with three main layers:

1. **eBay API Integration** - `search_ebay_finding_api()` handles requests to eBay's Finding API, supporting both active and sold (completed) listings with optional filters for condition and price range.

2. **Data Processing** - `parse_finding_results()` transforms eBay's nested JSON response into flat item objects. `calculate_price_stats()` computes statistical metrics (mean, median, min, max, std dev).

3. **REST Endpoints**:
   - `GET /search/sold?q=<keywords>` - Search completed/sold listings
   - `GET /search/active?q=<keywords>` - Search active listings
   - `GET /search/compare?q=<keywords>` - Compare sold vs active prices with recommendation
   - `GET /health` - Health check

## Notes

- No test framework is currently configured
- The eBay Finding API returns deeply nested JSON arrays; see `parse_finding_results()` for the extraction pattern
- Condition values map to eBay condition IDs via `CONDITION_MAP`
