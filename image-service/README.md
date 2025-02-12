# Hologram Label Generation Service

This service generates hologram labels for product packages by overlaying store names on pre-designed holographic backgrounds.

## Features

- Three different holographic backgrounds:
  - Gear pattern
  - Round pattern
  - Square pattern
- Random background selection for variety
- Centered store name with white text and black outline
- PNG output format

## Setup

1. Create a Python virtual environment (already done if you cloned the repository):
```bash
python3 -m venv venv
```

2. Activate the virtual environment:
- On Unix or MacOS:
```bash
source venv/bin/activate
```
- On Windows:
```bash
.\venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Service

1. Activate the virtual environment (if not already activated)
2. Start the server:
```bash
uvicorn src.main:app --reload --port 5001
```

The service will be available at http://localhost:5001

## API Endpoints

### Generate Hologram
POST `/generate-hologram`

Request body:
```json
{
    "store_name": "Your Store Name"
}
```

Response:
```json
{
    "image": "base64_encoded_png_string"
}
```

The service:
1. Randomly selects one of three holographic backgrounds
2. Overlays the store name with white text and black outline for visibility
3. Returns the result as a base64-encoded PNG image

### Health Check
GET `/health`

Response:
```json
{
    "status": "healthy"
}