import os
import json
import base64
import google.generativeai as genai
from PIL import Image
import io
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class AadhaarExtractor:
    def __init__(self, api_key=None):
        """
        Initialize the Aadhaar extractor with Google Gemini API
        """
        self.api_key = api_key or os.getenv('GOOGLE_API_KEY')
        if not self.api_key:
            raise ValueError("Google API key is required. Set GOOGLE_API_KEY environment variable or pass as argument.")
        
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
    
    def image_to_base64(self, image_path):
        """
        Convert image to base64 string
        """
        with Image.open(image_path) as img:
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Convert to bytes
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            buffer.seek(0)
            
            # Encode to base64
            image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
            return image_base64
    
    def extract_aadhaar_info(self, front_image_path, back_image_path):
        """
        Extract Aadhaar information from front and back images
        """
        try:
            # Convert images to base64
            front_image_base64 = self.image_to_base64(front_image_path)
            back_image_base64 = self.image_to_base64(back_image_path)
            
            # Prepare the prompt
            prompt = """
            Analyze these two Aadhaar card images (front and back) and extract the following information in JSON format:
            
            Required fields:
            - name: Full name of the card holder
            - dob: Date of birth (YYYY-MM-DD format)
            - gender: Gender (Male/Female/Other)
            - aadhaar_number: 12-digit Aadhaar number
            - address: Complete address including house number, street, city, state, pincode
            
            Important instructions:
            1. Extract text exactly as it appears on the card
            2. For Aadhaar number, only include the 12-digit number without spaces or other characters
            3. For date of birth, convert to YYYY-MM-DD format if possible
            4. Combine address from both front and back if needed
            5. If any field is not found, set it to null
            6. Return ONLY valid JSON, no additional text
            
            JSON structure:
            {
                "name": "string",
                "dob": "string in YYYY-MM-DD format",
                "gender": "string",
                "aadhaar_number": "string (12 digits)",
                "address": "string"
            }
            """
            
            # Prepare the message with images
            message = [
                prompt,
                {
                    "mime_type": "image/jpeg",
                    "data": front_image_base64
                },
                {
                    "mime_type": "image/jpeg", 
                    "data": back_image_base64
                }
            ]
            
            # Generate response
            response = self.model.generate_content(message)
            
            # Extract JSON from response
            response_text = response.text.strip()
            
            # Clean the response to extract JSON
            if '```json' in response_text:
                json_str = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                json_str = response_text.split('```')[1].strip()
            else:
                json_str = response_text
            
            # Parse JSON
            aadhaar_data = json.loads(json_str)
            
            return aadhaar_data
            
        except Exception as e:
            return {
                "error": f"Error processing images: {str(e)}",
                "name": None,
                "dob": None, 
                "gender": None,
                "aadhaar_number": None,
                "address": None
            }
    
    def extract_single_image(self, image_path, image_type="front"):
        """
        Extract information from single Aadhaar image (front or back)
        """
        try:
            image_base64 = self.image_to_base64(image_path)
            
            prompt = f"""
            Analyze this Aadhaar card {image_type} image and extract available information.
            
            Look for:
            - name: Full name
            - dob: Date of birth  
            - gender: Gender
            - aadhaar_number: 12-digit number
            - address: Complete address
            
            Return as JSON with available fields only. If field not found, set to null.
            
            Return ONLY valid JSON, no additional text.
            """
            
            message = [
                prompt,
                {
                    "mime_type": "image/jpeg",
                    "data": image_base64
                }
            ]
            
            response = self.model.generate_content(message)
            response_text = response.text.strip()
            
            # Clean response
            if '```json' in response_text:
                json_str = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                json_str = response_text.split('```')[1].strip()
            else:
                json_str = response_text
            
            return json.loads(json_str)
            
        except Exception as e:
            return {"error": str(e)}

def main():
    """
    Main function to demonstrate usage
    """
    # Initialize extractor
    extractor = AadhaarExtractor()
    
    # Paths to your Aadhaar images
    front_image_path = "assets/jonyfront.png"  # Replace with your front image path
    back_image_path = "assets/jonyfront.png"    # Replace with your back image path
    
    # Check if files exist
    if not os.path.exists(front_image_path):
        print(f"Front image not found: {front_image_path}")
        return
    if not os.path.exists(back_image_path):
        print(f"Back image not found: {back_image_path}")
        return
    
    print("Extracting Aadhaar information...")
    
    # Extract information from both images
    result = extractor.extract_aadhaar_info(front_image_path, back_image_path)
    
    # Print results
    print("\nExtracted Aadhaar Information:")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    # Save to JSON file
    output_file = "aadhaar_data.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"\nData saved to: {output_file}")

if __name__ == "__main__":
    main()