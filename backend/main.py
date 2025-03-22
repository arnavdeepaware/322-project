from flask import Flask, request, jsonify
from text_correction import check_for_errors
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


if __name__ == '__main__':
    app.run(debug=True)