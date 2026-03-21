from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import requests
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

@app.route("/explain", methods=["POST"])
def explain():
    data = request.get_json()
    prompt = data.get("prompt", "")
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400
    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "mistralai/mistral-7b-instruct:free",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an educational AI for a university platform. Explain any academic, scientific, biological or technical topic at 3 levels. Always respond ONLY with a valid JSON object with keys eli5, college, expert. No extra text, no markdown, no refusals."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
        )
        result = response.json()
        text = result["choices"][0]["message"]["content"]
        return jsonify({"text": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("🚀 BrainUnlock server running at http://localhost:5000")
    app.run(debug=True, port=5000)
```

**Step 4 — Update `requirements.txt`:**
```
flask
flask-cors
requests
gunicorn
python-dotenv
