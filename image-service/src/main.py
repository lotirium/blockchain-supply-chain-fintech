from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import base64
import logging
import random
import os
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the backgrounds directory path
BACKGROUNDS_DIR = Path(__file__).parent.parent / 'backgrounds'
BACKGROUND_FILES = ['holo_gear.webp', 'holo_round.webp', 'holo_square.webp']

class HologramRequest(BaseModel):
    store_name: str

def create_hologram(store_name: str) -> Image.Image:
    # Randomly select a background
    background_file = random.choice(BACKGROUND_FILES)
    background_path = BACKGROUNDS_DIR / background_file
    
    # Open and convert background to RGBA
    background = Image.open(background_path).convert('RGBA')
    
    # Create drawing context
    draw = ImageDraw.Draw(background)
    
    # Try to load font
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60)
    except IOError:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial Bold.ttf", 60)
        except IOError:
            font = ImageFont.load_default()
    
    # Get text size for centering
    # Note: textsize is deprecated in newer versions, using textbbox if available
    if hasattr(draw, 'textbbox'):
        bbox = draw.textbbox((0, 0), store_name, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
    else:
        text_width, text_height = draw.textsize(store_name, font=font)
    
    # Calculate text position (center)
    text_x = (background.width - text_width) // 2
    text_y = (background.height - text_height) // 2
    
    # Draw text with outline for better visibility
    outline_color = (0, 0, 0)
    text_color = (255, 255, 255)
    
    # Draw outline
    offsets = [(-2, -2), (2, -2), (-2, 2), (2, 2)]
    for offset_x, offset_y in offsets:
        draw.text(
            (text_x + offset_x, text_y + offset_y),
            store_name,
            font=font,
            fill=outline_color
        )
    
    # Draw main text
    draw.text(
        (text_x, text_y),
        store_name,
        font=font,
        fill=text_color
    )
    
    return background

@app.post("/generate-hologram")
async def generate_hologram(request: HologramRequest):
    try:
        logger.info(f"Generating hologram for store: {request.store_name}")
        
        # Create the hologram image
        image = create_hologram(request.store_name)
        
        # Convert to PNG
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        logger.info("Hologram generated successfully")
        return {"image": img_str}
            
    except Exception as e:
        logger.error(f"Error generating hologram: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate hologram: {str(e)}"
        )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}