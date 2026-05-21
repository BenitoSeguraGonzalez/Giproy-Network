import json
import os
import sys

# Ensure the app directory is in the path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.main import app
from app.api.api import api_router
from app.core.config import settings

def export_openapi():
    # Use the app's internal method to generate the schema
    openapi_schema = app.openapi()
    
    # Target directory
    output_dir = os.path.join("docs", "architecture")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
        
    output_path = os.path.join(output_dir, "openapi.json")
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2, ensure_ascii=False)
        
    print(f"✅ Success: OpenAPI schema exported to {output_path}")

if __name__ == "__main__":
    export_openapi()
