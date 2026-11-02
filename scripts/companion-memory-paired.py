"""Loopback-only synthetic fixture for the real Guardian/Core HTTP contract."""
import sys
from pathlib import Path
from uuid import UUID

root = Path(sys.argv[1]).resolve()
sys.path[:0] = [str(root), str(root / "tests")]
from test_companion_memory_chat import MemoryChatTests
from app.memory.companion_chat import CHAT_SCOPES
from dataclasses import replace
import uvicorn

fixture = MemoryChatTests()
fixture.setUp()
app = fixture.app

@app.get("/fixture")
def identity():
    return {"household": fixture.house, "memory_id": fixture.memory}

@app.post("/fixture/revoke")
def revoke():
    fixture.principal = replace(fixture.principal, scopes=fixture.principal.scopes - CHAT_SCOPES)
    return {"revoked": True}

try:
    uvicorn.run(app, host="127.0.0.1", port=int(sys.argv[2]), access_log=False, log_level="warning")
finally:
    fixture.doCleanups()
