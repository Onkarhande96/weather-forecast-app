import uvicorn
import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0" if os.environ.get("PORT") else "127.0.0.1")
    reload_mode = False if os.environ.get("PORT") else True
    print(f"🚀 Starting AtmosphereX Weather Dashboard on http://{host}:{port}")
    print(f"📖 Swagger API Docs available at: http://{host}:{port}/docs")
    uvicorn.run("app.main:app", host=host, port=port, reload=reload_mode)
