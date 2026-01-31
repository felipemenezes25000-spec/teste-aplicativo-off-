"""
Monitoring Configuration for RenoveJá+ API
Sentry integration for error tracking and performance monitoring
"""

import os
import logging
from dotenv import load_dotenv
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
# from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration  # Not needed for Supabase

load_dotenv()

def init_sentry(app_name: str = "renoveja-backend", environment: str = None):
    """
    Initialize Sentry monitoring
    
    Args:
        app_name: Application name for Sentry
        environment: Environment (development, staging, production)
    """
    sentry_dsn = os.getenv("SENTRY_DSN")
    
    if not sentry_dsn:
        logging.warning("SENTRY_DSN not configured. Monitoring disabled.")
        return
    
    # Configure logging integration
    logging_integration = LoggingIntegration(
        level=logging.INFO,        # Capture info and above as breadcrumbs
        event_level=logging.ERROR  # Send errors as events
    )
    
    # Determine environment
    if not environment:
        environment = os.getenv("ENV", "development")
    
    # Initialize Sentry
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=environment,
        integrations=[
            FastApiIntegration(
                transaction_style="endpoint",
                failed_request_status_codes=[400, 401, 403, 404, 405, 422]
            ),
            logging_integration,
        ],
        
        # Performance Monitoring
        traces_sample_rate=get_traces_sample_rate(environment),
        
        # Session tracking
        release=os.getenv("RELEASE_VERSION", "1.0.0"),
        
        # Additional options
        attach_stacktrace=True,
        send_default_pii=False,  # Don't send personally identifiable information
        
        # Before send hook to filter sensitive data
        before_send=before_send_filter,
        
        # Ignore certain errors
        ignore_errors=[
            KeyboardInterrupt,
            SystemExit,
        ],
    )
    
    logging.info(f"Sentry initialized for {app_name} in {environment} environment")

def get_traces_sample_rate(environment: str) -> float:
    """
    Get appropriate traces sample rate based on environment
    
    Args:
        environment: Current environment
        
    Returns:
        Sample rate between 0.0 and 1.0
    """
    rates = {
        "development": 1.0,  # Capture all transactions in development
        "staging": 0.5,      # Capture 50% in staging
        "production": 0.1,   # Capture 10% in production to reduce overhead
    }
    return rates.get(environment, 0.1)

def before_send_filter(event, hint):
    """
    Filter sensitive data before sending to Sentry
    
    Args:
        event: The event dictionary
        hint: Additional information about the error
        
    Returns:
        Modified event or None to drop the event
    """
    # Filter out sensitive data from request data
    if 'request' in event:
        request = event['request']
        
        # Remove sensitive headers
        if 'headers' in request:
            sensitive_headers = ['authorization', 'cookie', 'x-api-key']
            for header in sensitive_headers:
                if header in request['headers']:
                    request['headers'][header] = '[FILTERED]'
        
        # Remove sensitive form data
        if 'data' in request:
            sensitive_fields = ['password', 'token', 'api_key', 'secret', 'cpf', 'credit_card']
            for field in sensitive_fields:
                if field in request['data']:
                    request['data'][field] = '[FILTERED]'
    
    # Filter out health check endpoints
    if 'transaction' in event:
        if event['transaction'] in ['/api/health', '/health', '/']:
            return None
    
    return event

def capture_exception(error: Exception, context: dict = None):
    """
    Manually capture an exception with additional context
    
    Args:
        error: The exception to capture
        context: Additional context to attach to the error
    """
    if sentry_sdk.Hub.current.client:
        with sentry_sdk.push_scope() as scope:
            if context:
                for key, value in context.items():
                    scope.set_extra(key, value)
            sentry_sdk.capture_exception(error)

def capture_message(message: str, level: str = "info", context: dict = None):
    """
    Capture a message with additional context
    
    Args:
        message: The message to capture
        level: Log level (debug, info, warning, error, fatal)
        context: Additional context to attach to the message
    """
    if sentry_sdk.Hub.current.client:
        with sentry_sdk.push_scope() as scope:
            if context:
                for key, value in context.items():
                    scope.set_extra(key, value)
            sentry_sdk.capture_message(message, level=level)

def set_user_context(user_id: str, email: str = None, role: str = None):
    """
    Set user context for error tracking
    
    Args:
        user_id: User ID
        email: User email (optional)
        role: User role (optional)
    """
    if sentry_sdk.Hub.current.client:
        sentry_sdk.set_user({
            "id": user_id,
            "email": email,
            "role": role
        })

def add_breadcrumb(message: str, category: str = "custom", level: str = "info", data: dict = None):
    """
    Add a breadcrumb for debugging
    
    Args:
        message: Breadcrumb message
        category: Category (custom, http, navigation, etc.)
        level: Log level
        data: Additional data
    """
    if sentry_sdk.Hub.current.client:
        sentry_sdk.add_breadcrumb(
            message=message,
            category=category,
            level=level,
            data=data or {}
        )