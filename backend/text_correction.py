import vertexai
from google.oauth2 import service_account
from vertexai.preview.generative_models import GenerativeModel
import json


PROJECT_ID = "softwaredesign-443701"  # Replace with your Project ID
LOCATION = "us-central1"
credentials = service_account.Credentials.from_service_account_file("backend\\vertexai_key.json")
vertexai.init(project=PROJECT_ID, location=LOCATION, credentials=credentials)
gemini_model = GenerativeModel("gemini-1.5-flash")


def check_for_errors(text):
    prompt = """
        You are a grammar expert. Analyze the given text for errors and suggest corrections.
        Provide your output as a valid JSON array in this exact format:

        [
        {{
            "error": "the incorrect text",
            "correction": "corrected version",
            "position": index where the error starts
        }}
        ]

        
        Text: "{}"
        """.format(text)
    response = gemini_model.generate_content(contents=prompt)
    response = response.text.replace('```json',"").replace('```',"").strip()
    response_json = json.loads(response)
    return response_json

def replace_Text(text,errors):
    prompt = """
        You are a grammar expert. Analyze the given text and the provided errors output the corrected version of the text.
        Provide your output as a valid JSON array in this exact format:

        [
        {{
            "Corrected Text": The full text with all errors corrected.
        }}
        ]

        
        Text: "{}"
        errors:"{}"
        """.format(text,errors)
    response = gemini_model.generate_content(contents=prompt)
    response = response.text.replace('```json',"").replace('```',"").strip()
    response_json = json.loads(response)
    return response_json