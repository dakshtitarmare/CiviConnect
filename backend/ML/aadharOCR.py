"""
aadharOCR_auto.py

Auto-detect Aadhaar card in an image, OCR it with Tesseract and extract:
- name (uses spaCy NER if available, else regex fallback)
- gender
- date of birth
- mobile number
- Aadhaar number
- address (best-effort)

Replace image_path below or pass CLI argument.
"""

import cv2
import numpy as np
import pytesseract
import re, os, time, json
from pathlib import Path
import sys

# Try to import spaCy; if not available or model missing we will fallback to regex for name
try:
    import spacy
    try:
        NER = spacy.load("en_core_web_sm")
        SPACY_OK = True
    except Exception:
        NER = None
        SPACY_OK = False
except Exception:
    NER = None
    SPACY_OK = False

# If your tesseract binary is not in PATH on macOS / Linux set it here:
# pytesseract.pytesseract.tesseract_cmd = r"/usr/local/bin/tesseract"
# or: r"/opt/homebrew/bin/tesseract"
# Un-comment and adjust if needed:
# pytesseract.pytesseract.tesseract_cmd = r"/usr/local/bin/tesseract"

def resize_max(img, max_dim=1200):
    h,w = img.shape[:2]
    if max(h,w) <= max_dim:
        return img
    scale = max_dim / float(max(h,w))
    return cv2.resize(img, (int(w*scale), int(h*scale)), interpolation=cv2.INTER_AREA)

def find_document_contour(img_gray):
    """
    Find largest 4-point contour in the image (likely the card).
    Returns approximated 4 pts or None.
    """
    blurred = cv2.GaussianBlur(img_gray, (5,5), 0)
    edged = cv2.Canny(blurred, 50, 200)
    # dilate to connect edges
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5,5))
    edged = cv2.dilate(edged, kernel, iterations=1)

    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]

    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            pts = approx.reshape(4, 2)
            return order_points(pts)
    return None

def order_points(pts):
    # orders points as top-left, top-right, bottom-right, bottom-left
    rect = np.zeros((4,2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect

def four_point_transform(image, pts, out_w=None, out_h=None):
    rect = pts
    (tl, tr, br, bl) = rect
    # compute widths and heights
    widthA = np.linalg.norm(br - bl)
    widthB = np.linalg.norm(tr - tl)
    maxWidth = int(max(widthA, widthB)) if out_w is None else out_w

    heightA = np.linalg.norm(tr - br)
    heightB = np.linalg.norm(tl - bl)
    maxHeight = int(max(heightA, heightB)) if out_h is None else out_h

    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]
    ], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
    return warped

def preprocess_for_ocr(img):
    """
    Return a grayscale, possibly thresholded version suitable for OCR.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # optional denoising
    gray = cv2.bilateralFilter(gray, 9, 75, 75)
    # adaptive threshold may hurt colored backgrounds; we try both later if needed
    return gray

def ocr_image(img, config="--psm 3 --oem 3"):
    # returns raw string from pytesseract
    text = pytesseract.image_to_string(img, lang='eng', config=config)
    return text

# Parsers
def extract_aadhaar_number(s):
    # looks for 12-digit Aadhaar variants: spaced or contiguous
    m = re.search(r'(\d{4}\s\d{4}\s\d{4})', s)
    if m:
        return m.group(1)
    m = re.search(r'(\d{12})', s)
    if m:
        # format it as groups of 4
        t = m.group(1)
        return f"{t[:4]} {t[4:8]} {t[8:]}"
    return None

def extract_mobile_number(s):
    m = re.search(r'(\+91[\-\s]?|0)?(\d{10})', s)
    if m:
        return m.group(2)
    return None

def extract_gender(s):
    m = re.search(r'\b(MALE|FEMALE|Male|Female|male|female)\b', s)
    if m:
        return m.group(1).capitalize()
    return None

def extract_dob(s):
    # common Aadhaar DOB formats: dd/mm/yyyy or yyyy
    m = re.search(r'(\d{2}[\/\-]\d{2}[\/\-]\d{4})', s)
    if m:
        return m.group(1)
    m = re.search(r'(\d{4})', s)
    if m:
        return m.group(1)
    return None

def extract_address(s):
    # best-effort: find 'Address' and take following lines
    s_norm = s.replace('\r', '\n')
    lines = [ln.strip() for ln in s_norm.splitlines() if ln.strip()]
    # find 'Address' token
    idx = None
    for i, ln in enumerate(lines):
        if re.search(r'\bAddress\b[:\s]?', ln, re.IGNORECASE):
            idx = i
            break
    if idx is not None:
        # take up to next 6 lines after Address, or until a line that looks like a known field
        addr_lines = []
        for j in range(idx, min(idx + 6, len(lines))):
            # skip the "Address:" token itself if it's just a label
            if j == idx:
                maybe = re.sub(r'(?i)address[:\s]*', '', lines[j]).strip()
                if maybe:
                    addr_lines.append(maybe)
                continue
            if re.search(r'\bDOB\b|\bMale\b|\bFemale\b|\bAadhaar\b|\bName\b|\bUID\b', lines[j], re.IGNORECASE):
                break
            addr_lines.append(lines[j])
        return ", ".join(addr_lines) if addr_lines else None
    # fallback: attempt to take last 3-4 lines as address
    if len(lines) >= 3:
        return ", ".join(lines[-4:])
    return None

def extract_name(text, use_spacy=SPACY_OK):
    # prefer spaCy NER if available
    if use_spacy and NER is not None:
        doc = NER(text)
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                # return first person entity as name
                name = ent.text.strip()
                # sanitize: remove stray non-alpha chars at ends
                name = re.sub(r'^[^A-Za-z]+|[^A-Za-z0-9\s\.-]+$', '', name).strip()
                if name:
                    return name
    # fallback heuristics: look for lines with capitalized words, likely near top
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    # try scanning first 8 lines for probable name (caps + letters)
    for ln in lines[:10]:
        # ignore lines that are too long or contain "DOB", "Address", "Male" etc
        if len(ln) > 3 and not re.search(r'\bDOB\b|\bAddress\b|\bMale\b|\bFemale\b|\bAadhaar\b|\bUID\b|\d', ln, re.IGNORECASE):
            # accept lines that have at least one capitalized word
            if re.search(r'[A-Z][a-z]+', ln):
                return ln
    # last resort: return first capitalized tokens from whole text
    m = re.findall(r'[A-Z][a-z]+(?:\s[A-Z][a-z]+)*', text)
    if m:
        return m[0]
    return None

def extract_all_from_text(text):
    # normalize whitespace
    s = os.linesep.join([ln.strip() for ln in text.splitlines() if ln.strip()])
    aadhaar_num = extract_aadhaar_number(s)
    mobile = extract_mobile_number(s)
    gender = extract_gender(s)
    dob = extract_dob(s)
    address = extract_address(s)
    name = extract_name(s)
    return {
        "name": name,
        "gender": gender,
        "dob": dob,
        "mobile_number": mobile,
        "aadhaar_number": aadhaar_num,
        "address": address,
        "raw_text": s
    }

def save_to_json(data, prefix="aadhaar_info"):
    time_sec = str(time.time()).replace(".", "_")
    path = Path(f"{prefix}_{time_sec}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    return str(path)

def process_image_file(image_path):
    img_orig = cv2.imread(image_path)
    if img_orig is None:
        raise FileNotFoundError(f"Image not found: {image_path}")
    img = resize_max(img_orig, max_dim=1200)
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    doc_pts = find_document_contour(img_gray)
    if doc_pts is not None:
        warped = four_point_transform(img, doc_pts)
        card = warped
    else:
        # fallback: try using whole image (resized)
        card = img

    # Preprocess and OCR
    pre = preprocess_for_ocr(card)
    # Try normal OCR first
    text = ocr_image(pre, config="--psm 3 --oem 3")
    # if output looks empty or few chars, try thresholded version
    if len(text.strip()) < 10:
        # adaptive threshold
        th = cv2.adaptiveThreshold(pre, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 51, 15)
        text = ocr_image(th, config="--psm 3 --oem 3")

    parsed = extract_all_from_text(text)
    return parsed, text, card

if __name__ == "__main__":
    # CLI usage: pass image path as first arg
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    else:
        # change default if you want
        image_path = "backend/assets/image.png"

    try:
        parsed, raw_text, card_img = process_image_file(image_path)
    except Exception as e:
        print("❌ Error processing image:", str(e))
        sys.exit(1)

    print("🔎 Parsed fields:")
    for k,v in parsed.items():
        if k != "raw_text":
            print(f"  {k}: {v}")

    out_json_path = save_to_json(parsed)
    print("✅ Saved parsed output to", out_json_path)

    # optionally save the detected card crop for debugging
    debug_crop_path = Path("aadhaar_card_crop.png")
    cv2.imwrite(str(debug_crop_path), card_img)
    print("🖼️ Saved detected card crop to", debug_crop_path)
