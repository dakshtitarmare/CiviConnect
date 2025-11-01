import os
import io
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Tuple, List

import numpy as np
import cv2
from PIL import Image
from pdf2image import convert_from_path
from google.cloud import vision


# ==============================
# CONFIGURATION
# ==============================
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = (
    r"/Users/devdaksh/Desktop/Projects/CiviConnect/backend/ML/centered-flow-476906-q4-8d7298ab8e4f.json"
)

INPUT_FOLDER = r"/Users/devdaksh/Desktop/Projects/CiviConnect/backend/ML/input"
OUTPUT_FOLDER = r"/Users/devdaksh/Desktop/Projects/CiviConnect/backend/ML/output"

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)


# ==============================
# OCR & IMAGE PROCESSING
# ==============================
def detect_text_from_image(image_data: bytes) -> str:
    """
    Uses Google Cloud Vision API to detect text from image data.

    Args:
        image_data (bytes): The image data.

    Returns:
        str: Extracted text.
    """
    try:
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=image_data)
        response = client.text_detection(image=image)

        if response.error.message:
            logging.error(f"Vision API error: {response.error.message}")
            return ""

        texts = response.text_annotations
        return texts[0].description if texts else ""
    except Exception as e:
        logging.exception(f"Error detecting text: {e}")
        return ""


def preprocess_image(image: Image.Image) -> Image.Image:
    """
    Converts image to grayscale for better OCR accuracy.
    """
    try:
        image_np = np.array(image)
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)
        return Image.fromarray(gray)
    except Exception as e:
        logging.exception(f"Error preprocessing image: {e}")
        return image


def process_page(page: Image.Image, page_number: int) -> Tuple[int, str]:
    """
    Processes a single PDF page and returns extracted text.

    Args:
        page (PIL.Image.Image): PDF page.
        page_number (int): Page number.

    Returns:
        Tuple[int, str]: Page number and extracted text.
    """
    buffer = io.BytesIO()
    preprocess_image(page).save(buffer, format="PNG")

    text = detect_text_from_image(buffer.getvalue())
    return page_number, text


# ==============================
# PDF HANDLING
# ==============================
def process_pdf(pdf_path: str, output_folder: str) -> None:
    """
    Converts each PDF page to image, performs OCR, and saves results to a text file.

    Args:
        pdf_path (str): Path to the PDF file.
        output_folder (str): Directory to save output text.
    """
    try:
        pages = convert_from_path(pdf_path)
        logging.info(f"Processing '{pdf_path}' ({len(pages)} pages)...")

        output_file = os.path.join(
            output_folder, f"{os.path.basename(pdf_path)}.txt"
        )

        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(process_page, page, i + 1) for i, page in enumerate(pages)]
            results = sorted(
                (future.result() for future in as_completed(futures)),
                key=lambda x: x[0],
            )

        with open(output_file, "w", encoding="utf-8") as f:
            for page_number, text in results:
                f.write(f"\n--- Page {page_number} ---\n{text}\n\n")

        logging.info(f"OCR completed for {pdf_path}. Output: {output_file}")

    except Exception as e:
        logging.exception(f"Error processing PDF {pdf_path}: {e}")


def process_all_pdfs(input_folder: str, output_folder: str) -> None:
    """
    Processes all PDF files in a directory.
    """
    os.makedirs(output_folder, exist_ok=True)

    pdf_files = [f for f in os.listdir(input_folder) if f.lower().endswith(".pdf")]
    if not pdf_files:
        logging.warning("No PDF files found in input folder.")
        return

    for pdf_name in pdf_files:
        pdf_path = os.path.join(input_folder, pdf_name)
        process_pdf(pdf_path, output_folder)


# ==============================
# MAIN EXECUTION
# ==============================
if __name__ == "__main__":
    process_all_pdfs(INPUT_FOLDER, OUTPUT_FOLDER)
    logging.info("✅ All PDF text extraction completed successfully!")
