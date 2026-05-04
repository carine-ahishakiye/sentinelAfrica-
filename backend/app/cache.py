"""
cache.py — Background data cache for supply chain + resilience payloads.

Why: predict_supply_chain() + resilience_index() take ~22s to run.
     WebSocket clients time out waiting. This module precomputes the
     payload once, serves it instantly from memory, and refreshes every
     REFRESH_INTERVAL seconds in a background thread.
"""

import threading
import logging
import time
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

REFRESH_INTERVAL = 300   # seconds — refresh every 5 minutes

# ── Shared state ──────────────────────────────────────────────────────────────
_lock    = threading.Lock()
_payload = None           # the last successfully computed payload
_ready   = threading.Event()  # set once the first payload is available


def get_payload() -> dict | None:
    """Return the cached payload, or None if not yet ready."""
    with _lock:
        return _payload


def wait_for_payload(timeout: float = 60.0) -> dict | None:
    """Block until the first payload is ready, then return it."""
    _ready.wait(timeout=timeout)
    return get_payload()


def _compute() -> dict:
    """Run the slow data functions. Must NOT be called on the event loop."""
    # Import here to avoid circular imports at module load time
    from app.routers.predict    import predict_supply_chain
    from app.routers.resilience import resilience_index

    return {
        "risk":       predict_supply_chain(),
        "resilience": resilience_index(),
        "timestamp":  datetime.now(timezone.utc).strftime("%H:%M:%S UTC"),
    }


def _refresh_loop():
    """Background thread: compute payload once, then keep refreshing."""
    while True:
        start = time.time()
        try:
            logger.info("Cache: computing payload…")
            payload = _compute()

            with _lock:
                global _payload
                _payload = payload

            _ready.set()   # unblocks wait_for_payload on first run
            elapsed = time.time() - start
            logger.info("Cache: payload ready in %.1fs", elapsed)

        except Exception as exc:
            logger.error("Cache: compute failed: %s", exc)

        time.sleep(REFRESH_INTERVAL)


def start():
    """Start the background refresh thread. Call once from main.py startup."""
    t = threading.Thread(target=_refresh_loop, daemon=True, name="cache-refresh")
    t.start()
    logger.info("Cache: background refresh thread started (interval=%ds)", REFRESH_INTERVAL)