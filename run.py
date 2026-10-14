import uvicorn
import os
import sys

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0" if os.environ.get("PORT") else "127.0.0.1")
    reload_mode = False if os.environ.get("PORT") else True
    print(f"🚀 Starting AtmosphereX Weather Dashboard on http://{host}:{port}")
    print(f"📖 Swagger API Docs available at: http://{host}:{port}/docs")
    uvicorn.run("main:app", host=host, port=port, reload=reload_mode)
