from flask import Flask, request, jsonify
from text_correction import check_for_errors, replace_Text
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/check', methods=['POST'])
def check():
    data = request.json
    if 'text' not in data:
        return jsonify({"error": "Text input is required"}), 400
    result = check_for_errors(data['text'])
    return jsonify(result)

@app.route('/correct', methods=['POST'])
def correct():
    data = request.json
    if 'text' not in data or 'errors' not in data:
        return jsonify({"error": "Text and errors are required"}), 400
    result = replace_Text(data['text'], data['errors'])
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)