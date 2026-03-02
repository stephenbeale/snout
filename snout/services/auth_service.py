"""
eBay OAuth client_credentials token manager.
"""
import base64
import logging
import time

import requests

logger = logging.getLogger("snout.auth")


class AuthError(Exception):
    """Raised when token acquisition fails."""

    pass


class EbayAuthService:
    """Manages OAuth client_credentials tokens for eBay Browse API."""

    TOKEN_LIFETIME = 7200  # 2 hours

    def __init__(self, app_id: str, cert_id: str, token_endpoint: str = "https://api.ebay.com/identity/v1/oauth2/token"):
        self._app_id = app_id
        self._cert_id = cert_id
        self._token_endpoint = token_endpoint
        self._token: str | None = None
        self._expires_at: float = 0
        self._session = requests.Session()

    def get_token(self) -> str:
        """
        Return a valid Bearer token, refreshing if expired.

        Returns:
            Bearer token string

        Raises:
            AuthError: If token acquisition fails
        """
        if self._token and time.time() < self._expires_at:
            return self._token

        return self._refresh_token()

    def _refresh_token(self) -> str:
        """Fetch a new client_credentials token from eBay."""
        credentials = base64.b64encode(
            f"{self._app_id}:{self._cert_id}".encode()
        ).decode()

        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": f"Basic {credentials}",
        }

        data = {
            "grant_type": "client_credentials",
            "scope": "https://api.ebay.com/oauth/api_scope",
        }

        try:
            response = self._session.post(
                self._token_endpoint,
                headers=headers,
                data=data,
                timeout=10,
            )
            response.raise_for_status()
        except requests.RequestException as e:
            logger.error("Failed to acquire eBay token: %s", e)
            raise AuthError("Failed to acquire eBay OAuth token") from e

        body = response.json()
        self._token = body["access_token"]
        expires_in = body.get("expires_in", self.TOKEN_LIFETIME)
        # Refresh 60s early to avoid edge-case expiry
        self._expires_at = time.time() + expires_in - 60

        logger.info("eBay OAuth token refreshed (expires in %ds)", expires_in)
        return self._token
