import pytesseract
from PIL import Image
import cv2
import re

# IMPORTANT: Set the path to the Tesseract executable on your system
# Example for Windows:
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def extract_raw_text(image_path):
    """Performs OCR on the image to get all text."""
    try:
        # Open the image using Pillow
        text = pytesseract.image_to_string(Image.open(image_path))
        return text
    except pytesseract.TesseractNotFoundError:
        return "Tesseract not found. Please check the path or installation."
    except Exception as e:
        return f"An error occurred: {e}"

# Example usage
aadhaar_text = extract_raw_text('backend/assets/jonyfront.png')
print(aadhaar_text)