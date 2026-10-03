import os
import sys

# Ensure backend root is on Python module search path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from config import Config

if __name__ == "__main__":
    port = int(os.environ.get("PORT", Config.PORT))
    print(f"[*] Starting Resume Screening Server on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=Config.DEBUG)
