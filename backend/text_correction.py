import os
import json
from dotenv import load_dotenv
import openai

# Load OpenAI API key
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")


def check_for_errors(text):
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


def replace_Text(text, errors):
    system = (
        "You are a grammar expert. Given the original text and a list of grammar errors, produce the fully corrected text.\n"
        "IMPORTANT: Treat every occurrence of the literal token '****' as valid and immutable. Do NOT remove, modify, merge, or reposition any '****' tokens. They must remain in their original positions, even if the surrounding words change.\n"
        "Provide your output strictly as a JSON array in this exact format:\n"
        "[\n"
        "  { \"Corrected_Text\": The full text with all errors corrected. }\n"
        "]"
    )
    user = f"Text: \"{text}\"\nerrors: {json.dumps(errors)}"
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