import os
import json
from dotenv import load_dotenv, find_dotenv
import openai

# Load OpenAI API key from root .env file
load_dotenv(find_dotenv())
# Verify API key
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise EnvironmentError("OPENAI_API_KEY not found. Please set it in the .env file.")
openai.api_key = api_key

def check_for_errors_legacy(text):
    system = (
        "You are a grammar expert. Analyze the given text for grammatical errors and suggest corrections.\n"
        "IMPORTANT: Treat every occurrence of the literal token '****' as valid and part of the text. Do NOT remove, modify, or merge any '****' tokens under any circumstances, and ignore them during grammar checks.\n"
        "Provide your output strictly as a JSON array in this exact format:\n"
        "[\n"
        "  {\"error\": \"the incorrect text\", \"correction\": \"corrected version\", \"position\": index where the error starts}\n"
        "]"
    )
    user = f"Text: \"{text}\""
    res = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        temperature=0
    )
    content = res.choices[0].message.content.strip().replace('```json','').replace('```','').strip()
    return json.loads(content)

def check_for_errors(text):
    system = ("""
        You are an expert copy-editor. Your job is to CORRECT ONLY real spelling, grammar, or word‐usage errors.
        ⚠️ Do NOT change any punctuation marks (.,!?,;:"'), capitalization, or spacing that are already correct.
        Preserve every '****' token verbatim. Output ONLY the corrected text, no labels or fences.
        — You MUST NOT add, remove, or change any punctuation characters (.,!?;:—) unless they’re part of a genuine error you’re correcting.  
        — You MUST NOT insert any new exclamation marks, periods, etc. unless they’re part of a genuine error you’re correcting.
        — You MUST NOT change the capitalization of any words unless they’re part of a genuine error you’re correcting.  
        — If there are no errors, ouutput an empty string.

        EXAMPLES:
        Input: "I am here!"
        Output: "I am here!"

        Input: "hllo, wrld!"
        Output: "Hello, world!"
        
        "Input: "Hlleo, wrld!"
        "Output: "Hello, world!"
        "Input: "I cant go to the party"
        "Output: "I can't go to the party."
    """
    )
    user = text
    res = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        temperature=0
    )
    content = res.choices[0].message.content.strip().replace('```json','').replace('```','').strip()
    return content

def shakesperize_text(text):
    system = (
        "Convert the the given input text into Shakespearean English, preserving the original meaning but using appropriate vocabulary, style, and expressions from the Elizabethan era."
    )
    user = f"Input Text: \"{text}\""
    res = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        temperature=0.3
    )
    return res.choices[0].message.content.strip()

# def replace_Text(text, errors):
#     system = (
#         "You are a grammar expert. Given the original text and a list of grammar errors, produce the fully corrected text.\n"
#         "IMPORTANT: Treat every occurrence of the literal token '****' as valid and immutable. Do NOT remove, modify, merge, or reposition any '****' tokens. They must remain in their original positions, even if the surrounding words change.\n"
#         "Provide your output strictly as a JSON array in this exact format:\n"
#         "[\n"
#         "  { \"Corrected_Text\": The full text with all errors corrected. }\n"
#         "]"
#     )
#     user = f"Text: \"{text}\"\nerrors: {json.dumps(errors)}"
#     res = openai.chat.completions.create(
#         model="gpt-3.5-turbo",
#         messages=[
#             {"role": "system", "content": system},
#             {"role": "user", "content": user}
#         ],
#         temperature=0
#     )
#     content = res.choices[0].message.content.strip().replace('```json','').replace('```','').strip()
#     return json.loads(content)