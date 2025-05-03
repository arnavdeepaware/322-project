import vertexai
from google.oauth2 import service_account
from vertexai.preview.generative_models import GenerativeModel
from diff_match_patch import diff_match_patch
import json
from flask import jsonify


PROJECT_ID = "softwaredesign-443701"  # Replace with your Project ID
LOCATION = "us-central1"
credentials = service_account.Credentials.from_service_account_file("backend\\vertexai_key.json")
vertexai.init(project=PROJECT_ID, location=LOCATION, credentials=credentials)
gemini_model = GenerativeModel("gemini-1.5-flash")
dmp = diff_match_patch()

def check_for_errors(text):
    prompt = """
        You are a grammar expert. Correct the text below (keep any '****' tokens exactly where they are). 
        Output ONLY the corrected text, no code fences.
        
        
        Text: "{}"
        """.format(text)
    response = gemini_model.generate_content(contents=prompt)
    response = response.text.replace('```json',"").replace('```',"").strip()
    return response

def replace_Text(text,errors):
    prompt = """
        You are a grammar expert. Given the original text and a list of grammar errors, produce the fully corrected text.
        IMPORTANT: Treat every occurrence of the literal token '****' as valid and immutable. Do NOT remove, modify, merge, or reposition any '****' tokens. They must remain in their original positions, even if the surrounding words change.
        Provide your output strictly as a JSON array in this exact format:

        [
        {{
            "Corrected_Text": The full text with all errors corrected.
        }}
        ]

        Text:
        "{}"
        errors:
        "{}"
        """.format(text,errors)
    response = gemini_model.generate_content(contents=prompt)
    response = response.text.replace('```json',"").replace('```',"").strip()
    response_json = json.loads(response)
    return response_json