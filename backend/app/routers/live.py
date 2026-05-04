from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState
import asyncio
import logging
from datetime import datetime

from app import cache

logger = logging.getLogger(__name__)
router = APIRouter()


def _ws_open(ws: WebSocket) -> bool:
    return ws.client_state == WebSocketState.CONNECTED


async def _safe_send(ws: WebSocket, data: dict) -> bool:
    if not _ws_open(ws):
        return False
    try:
        await ws.send_json(data)
        return True
    except (WebSocketDisconnect, RuntimeError):
        return False


@router.websocket("/ws/supply-chain")
async def supply_chain_ws(ws: WebSocket):
    await ws.accept()
    logger.info("WS connected: %s", ws.client)

    try:
        # ── Phase 1: Wait for cache to be ready, pinging client every 5s ──
        waited = 0
        while True:
            payload = cache.get_payload()
            if payload is not None:
                break  # cache ready — proceed to live loop

            # Cache still warming up — tell the client so it shows a nice message
            ok = await _safe_send(ws, {
                "warming": True,
                "message": f"Backend warming up… ({waited}s elapsed)",
                "timestamp": datetime.utcnow().strftime("%H:%M:%S UTC"),
            })
            if not ok:
                logger.info("Client left during warmup.")
                return

            await asyncio.sleep(5)
            waited += 5

            # Hard cap: if still not ready after 90s, use wait_for_payload blocking call
            if waited >= 90:
                logger.warning("Cache not ready after 90s — blocking wait…")
                loop = asyncio.get_event_loop()
                payload = await asyncio.wait_for(
                    loop.run_in_executor(None, cache.wait_for_payload, 60.0),
                    timeout=65.0,
                )
                if payload is None:
                    await _safe_send(ws, {
                        "error": "Backend data unavailable after 2.5 min — please restart the server.",
                        "timestamp": datetime.utcnow().strftime("%H:%M:%S UTC"),
                    })
                    return
                break

        # ── Phase 2: Live push loop — serve from cache every 60s ──
        while True:
            payload = cache.get_payload()
            if payload is None:
                await asyncio.sleep(5)
                continue

            out = dict(payload)
            out["timestamp"] = datetime.utcnow().strftime("%H:%M:%S UTC")

            ok = await _safe_send(ws, out)
            if not ok:
                logger.info("Client gone — exiting.")
                return

            logger.info(
                "Pushed: risk=%d resilience=%d @ %s",
                out.get("risk", {}).get("total", 0),
                out.get("resilience", {}).get("total", 0),
                out["timestamp"],
            )

            await asyncio.sleep(60)

    except asyncio.TimeoutError:
        logger.error("Timed out waiting for cache payload.")
        await _safe_send(ws, {"error": "Server timed out building data.", "timestamp": datetime.utcnow().strftime("%H:%M:%S UTC")})
    except WebSocketDisconnect:
        logger.info("WS disconnected cleanly: %s", ws.client)
    except Exception as exc:
        logger.error("WS unexpected error: %s", exc)
    finally:
        logger.info("WS handler done: %s", ws.client)