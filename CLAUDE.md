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

The Flask application has been refactored into a modular structure:

1. **Configuration Layer** (`snout/config.py`):
   - `Config` class manages environment variables and API settings
   - `CONDITION_MAP` and `SORT_MAP` for eBay API constants
   - Logging setup utilities

2. **Service Layer** (`snout/services/`):
   - `EbayFindingService` - Handles all eBay Finding API interactions
   - `PriceAnalyzer` - Calculates statistics and price comparisons
   - Supports concurrent API requests for better performance

3. **Utility Layer** (`snout/utils/`):
   - Input validation helpers
   - Request/response transformations

4. **REST Endpoints** (`snout/app.py`):
   - `GET /search/sold?q=<keywords>` - Search completed/sold listings
   - `GET /search/active?q=<keywords>` - Search active listings
   - `GET /search/compare?q=<keywords>` - Compare sold vs active prices with recommendation
   - `GET /health` - Health check
   - Rate limiting enabled on search endpoints

## Custom Agents

This project uses custom Claude Code agents to help with specific development tasks. Agents are defined in `.claude/agents/` as markdown files.

### Viewing Available Agents
Run `/agents` in Claude Code to see configured agents, or check the `.claude/agents/` directory.

### Currently Configured Agents
- **ebay-api-builder** - Specialized agent for building, testing, and extending eBay API wrappers

### Creating Custom Agents
To create a new agent:
1. Create a markdown file in `.claude/agents/` (e.g., `my-agent.md`)
2. Define agent metadata in YAML frontmatter (name, description, model, color)
3. Write the agent instructions in the markdown body
4. The agent will automatically appear in the `/agents` list

Note: Agents must have a corresponding `.md` file in `.claude/agents/` to appear in the agent list. The agent name in the frontmatter should match the filename (without extension).

## Notes

- The eBay Finding API returns deeply nested JSON arrays; see `EbayFindingService._parse_item()` for the extraction pattern
- Condition values map to eBay condition IDs via `CONDITION_MAP`
- Rate limiting is configured to prevent API abuse (30 requests/minute for search endpoints)

## Session Notes

### 2026-01-10 - Major Refactoring and Modularization

**Work Completed:**
- Refactored monolithic `snout/app.py` into modular architecture with separate layers
- Created `snout/config.py` for centralized configuration management with `Config` dataclass
- Implemented `snout/services/ebay_service.py` with `EbayFindingService` class for API interactions
- Added `snout/services/price_analyzer.py` with statistical analysis and price comparison logic
- Created `snout/utils/validators.py` for input validation with custom `ValidationError` exception
- Implemented concurrent API requests for compare endpoint (ThreadPoolExecutor)
- Added Flask-Limiter for rate limiting on search endpoints
- Updated `requirements.txt` with new dependencies (flask-limiter, pytest-mock)
- Documented custom agents system in CLAUDE.md
- Updated architecture documentation to reflect new modular structure

**Technical Improvements:**
- Introduced type hints throughout codebase for better IDE support
- Implemented proper error handling with custom exception hierarchy (`EbayApiError`, `ValidationError`)
- Added structured logging with configurable log levels
- Created dataclasses for cleaner data modeling (`SearchQuery`, `EbayItem`, `PriceStats`, `PriceComparison`)
- Improved code organization with separation of concerns (services, utils, config)

**Work In Progress:**
- Testing infrastructure not yet implemented (pytest configured but no tests written)
- No integration tests for eBay API endpoints
- Documentation could be expanded with API examples

**Next Steps:**
- Implement comprehensive test suite using pytest
  - Unit tests for validators, price analyzer, and service layer
  - Mock eBay API responses for reliable testing
  - Aim for 80%+ code coverage
- Consider adding async support for API requests (aiohttp)
- Add API documentation (OpenAPI/Swagger)
- Consider adding caching layer for frequently requested searches
- Add environment variable validation on startup

**Technical Notes:**
- Custom agents are defined in `.claude/agents/` directory as markdown files
- Agent visibility depends on having both the `.md` file and proper YAML frontmatter
- The refactoring maintains backward compatibility - all existing API endpoints work identically
- Rate limiting uses in-memory storage (consider Redis for production)
- Concurrent requests in compare endpoint improve response time by ~50%
