import os
import requests
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import vertexai
from google.oauth2 import service_account
from vertexai.preview.generative_models import GenerativeModel
from vertexai.preview.vision_models import ImageGenerationModel
from fastapi.middleware.cors import CORSMiddleware
import json
import base64
from io import BytesIO

# Load environment variables from .env file
PROJECT_ID = "softwaredesign-443701"  # Replace with your Project ID
LOCATION = "us-central1"
credentials = service_account.Credentials.from_service_account_file("backend\\vertexai_key.json")
vertexai.init(project=PROJECT_ID, location=LOCATION, credentials=credentials)
gemini_model = GenerativeModel("gemini-1.5-flash")

app = Flask(__name__)

def check_for_errors(text):
    prompt = """
        You are a grammar expert. Analyze the given text for errors and suggest corrections.
        Provide your output as a valid JSON array in this exact format:

        [
        {{
            "error": "incorrect word or phrase",
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

