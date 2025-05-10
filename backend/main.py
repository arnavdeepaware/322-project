from flask import Flask, request, jsonify
from text_correction import check_for_errors
from flask_cors import CORS
from diff_match_patch import diff_match_patch

app = Flask(__name__)
CORS(app)


@app.route('/check', methods=['POST'])
def check():
    data = request.json
    if 'text' not in data:
        return jsonify({"error": "Text input is required"}), 400
    result = check_for_errors(data['text'])
    


    #Make correction patches
    dmp = diff_match_patch()
    patches = dmp.patch_make(data['text'], result)
    ops  = []
    for patch in patches:
        idx = patch.start1
        for i, (op, chunk) in enumerate(patch.diffs):
            if op == dmp.DIFF_DELETE:
                # deletion followed by insertion is our correction
                rep = ''
                if i+1 < len(patch.diffs) and patch.diffs[i+1][0] == dmp.DIFF_INSERT:
                    rep = patch.diffs[i+1][1]
                ops.append({'start': idx, 'length': len(chunk), 'replacement': rep})
            if op != dmp.DIFF_INSERT:
                idx += len(chunk)

    return jsonify(ops) 

# @app.route('/correct', methods=['POST'])
# def correct():
#     data = request.json
#     if 'text' not in data or 'errors' not in data:
#         return jsonify({"error": "Text and errors are required"}), 400
#     result = replace_Text(data['text'], data['errors'])
#     return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)