"""Isolated loopback fixture using the reviewed Core source, never a live DB."""
import hmac
import os
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException
from app.api.shared_shop import shop_router
from app.decisions.shared_shop import SharedShop, ShopRepository
from app.models.intake import ServiceIdentity

temporary = tempfile.TemporaryDirectory(prefix="guardian-paired-")
clock = [datetime.now(timezone.utc)]
shop = SharedShop(ShopRepository(development_path=Path(temporary.name) / "shop.sqlite"), clock=lambda: clock[0])

def authenticate(service, key):
    if service != "guardian-paired-test" or not hmac.compare_digest(key or "", "synthetic-paired-test-credential-0000000000"):
        raise HTTPException(401, "Invalid synthetic service")
    return ServiceIdentity(service_id=service, product="family_guardian", trusted_source="family_guardian", allowed_domains=["shop", "location"])

app = FastAPI()
app.include_router(shop_router(shop, authenticate))

@app.post("/__synthetic/advance")
def advance():
    clock[0] += timedelta(minutes=6)
    shop.purge_expired_ephemeral()
    return {"advanced": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=int(os.environ["GUARDIAN_PAIRED_PORT"]), log_level="warning")
