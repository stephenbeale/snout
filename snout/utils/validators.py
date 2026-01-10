"""
Input validation utilities.
"""
import re
from dataclasses import dataclass


class ValidationError(Exception):
    """Raised when input validation fails."""

    def __init__(self, message: str, field: str | None = None):
        super().__init__(message)
        self.message = message
        self.field = field


# Characters that could be used for injection attacks
DANGEROUS_PATTERNS = [
    r"<script",
    r"javascript:",
    r"onclick=",
    r"onerror=",
]


def validate_keywords(
    keywords: str | None,
    min_length: int = 1,
    max_length: int = 1000,
) -> str:
    """
    Validate search keywords.

    Args:
        keywords: The search keywords to validate
        min_length: Minimum keyword length
        max_length: Maximum keyword length

    Returns:
        Sanitized keywords string

    Raises:
        ValidationError: If validation fails
    """
    if keywords is None:
        raise ValidationError("Missing required parameter: q", field="q")

    # Strip whitespace
    keywords = keywords.strip()

    if len(keywords) < min_length:
        raise ValidationError("Search keywords cannot be empty", field="q")

    if len(keywords) > max_length:
        raise ValidationError(
            f"Search keywords exceed maximum length of {max_length} characters",
            field="q",
        )

    # Check for dangerous patterns
    keywords_lower = keywords.lower()
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, keywords_lower, re.IGNORECASE):
            raise ValidationError("Invalid characters in search keywords", field="q")

    return keywords


def validate_price(
    value: float | None,
    field_name: str,
    min_value: float = 0,
    max_value: float = 1_000_000,
) -> float | None:
    """
    Validate price parameter.

    Args:
        value: The price value to validate
        field_name: Name of the field for error messages
        min_value: Minimum allowed value
        max_value: Maximum allowed value

    Returns:
        Validated price or None

    Raises:
        ValidationError: If validation fails
    """
    if value is None:
        return None

    if value < min_value:
        raise ValidationError(
            f"{field_name} must be at least {min_value}", field=field_name
        )

    if value > max_value:
        raise ValidationError(
            f"{field_name} cannot exceed {max_value}", field=field_name
        )

    return value
