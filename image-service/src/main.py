from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import base64
import logging
from typing import Optional
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProductDetails(BaseModel):
    name: str
    manufacturer: Optional[str] = "Unknown Manufacturer"
    orderId: str
    verificationCode: str

class HologramRequest(BaseModel):
    store_name: str
    product_id: str
    nft_token_id: Optional[str] = None
    product_details: ProductDetails
    hologram_style: Optional[str] = "round"  # Can be "round", "gear", or "square"
    background: Optional[str] = "transparent"  # Can be "transparent" or "white"

BACKGROUND_PATH = os.path.join(os.path.dirname(__file__), "..", "backgrounds")
HOLOGRAM_STYLES = {
    "round": "holo_round.png",
    "gear": "holo_gear.png",
    "square": "holo_square.png"
}

def convert_webp_to_png():
    """Convert webp files to png format"""
    webp_files = {
        "holo_round.webp": "holo_round.png",
        "holo_gear.webp": "holo_gear.png",
        "holo_square.webp": "holo_square.png"
    }
    
    for webp_file, png_file in webp_files.items():
        webp_path = os.path.join(BACKGROUND_PATH, webp_file)
        png_path = os.path.join(BACKGROUND_PATH, png_file)
        
        if os.path.exists(webp_path):
            try:
                # Load webp and convert to PNG with transparency
                with Image.open(webp_path) as img:
                    # Convert to RGBA to ensure transparency
                    img = img.convert('RGBA')
                    # Save as PNG
                    img.save(png_path, 'PNG')
                    logger.info(f"Converted {webp_file} to {png_file}")
            except Exception as e:
                logger.error(f"Error converting {webp_file}: {str(e)}")
                raise

# Convert webp files to png on startup
convert_webp_to_png()

def ensure_transparency(image: Image.Image) -> Image.Image:
    """Ensure image has proper transparency"""
    if image.mode != 'RGBA':
        return image.convert('RGBA')
    return image

def create_hologram_base(size: int, style: str = "round", background: str = "transparent") -> Image.Image:
    """Load and resize hologram background"""
    bg_file = HOLOGRAM_STYLES.get(style, "holo_round.png")
    bg_path = os.path.join(BACKGROUND_PATH, bg_file)
    
    try:
        # Create base image
        base = Image.new('RGBA', (size, size), 
                        (255, 255, 255, 255) if background == "white" else (0, 0, 0, 0))
        
        if not os.path.exists(bg_path):
            logger.error(f"Background file not found: {bg_path}")
            return base
        
        # Load and process hologram
        hologram = Image.open(bg_path).convert('RGBA')
        hologram = hologram.resize((size, size), Image.Resampling.LANCZOS)
        
        if background == "white":
            # Paste onto white background
            base.paste(hologram, (0, 0), hologram)
            result = base
        else:
            # Keep transparency
            result = hologram
            
        # Ensure image is properly loaded
        result.load()
        return result
    except Exception as e:
        logger.error(f"Error loading hologram background: {str(e)}")
        raise


def add_text(image: Image.Image, store_name: str, token_id: str) -> Image.Image:
    """Add simple white text overlay with store name"""
    # Create a copy of the image to avoid modifying the original
    result = image.copy()
    draw = ImageDraw.Draw(result)
    width, height = result.size
    
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial Bold.ttf", 22)
        except:
            font = ImageFont.load_default()
    
    # Add store name
    bbox = draw.textbbox((0, 0), store_name.upper(), font=font)
    text_width = bbox[2] - bbox[0]
    text_x = (width - text_width) // 2
    text_y = height // 2 - 12
    
    # Simple white text for maximum visibility
    draw.text((text_x, text_y), store_name.upper(), font=font, fill=(255, 255, 255))
    
    # Add token ID in smaller size below
    small_font = ImageFont.truetype(font.path, 18) if hasattr(font, 'path') else font
    # Use actual NFT token ID or indicate pending status
    token_text = f"NFT #{token_id if token_id != 'pending' else 'Pending'}"
    token_bbox = draw.textbbox((0, 0), token_text, font=small_font)
    token_width = token_bbox[2] - token_bbox[0]
    token_x = (width - token_width) // 2
    token_y = height // 2 + 30
    draw.text((token_x, token_y), token_text, font=small_font, fill=(255, 255, 255))
    
    return result

def create_hologram(request: HologramRequest) -> Image.Image:
    """Create a simple hologram with text overlay"""
    size = 300
    
    try:
        # Use requested style or fall back to round
        style = request.hologram_style if request.hologram_style in HOLOGRAM_STYLES else "round"
        logger.info(f"Using hologram style: {style}")
        
        # Create base hologram with specified background
        background = request.background if request.background in ["transparent", "white"] else "transparent"
        image = create_hologram_base(size, style, background)
        
        # Add text overlay with proper token ID handling
        token_id = request.nft_token_id
        if not token_id or token_id == 'pending':
            logger.info("No token ID provided or pending status")
            token_id = 'Pending'
        else:
            logger.info(f"Using NFT token ID: {token_id}")
        
        image = add_text(image, request.store_name.upper(), token_id)
        
        return image
        
    except Exception as e:
        logger.error(f"Error creating hologram: {str(e)}")
        raise

@app.post("/generate-product-hologram")
async def generate_product_hologram(request: HologramRequest):
    try:
        logger.info(f"Generating hologram for store: {request.store_name}, token ID: {request.nft_token_id}")
        
        # Create the hologram image
        image = create_hologram(request)
        logger.info(f"Created hologram: size={image.size}, mode={image.mode}, token_id={request.nft_token_id}")
        
        # Convert to PNG
        buffered = BytesIO()
        # Save without any optimization
        image.save(buffered, format="PNG")
        buffered.seek(0)
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        logger.info(f"Successfully encoded image as base64")
        
        return {
            "image": img_str,
            "size": image.size,
            "mode": image.mode,
            "format": "PNG"
        }
            
    except Exception as e:
        error_msg = f"Error generating hologram: {str(e)}"
        logger.error(error_msg)
        logger.exception(e)  # This will log the full stack trace
        raise HTTPException(
            status_code=500,
            detail=error_msg
        )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}