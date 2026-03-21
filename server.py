from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

@app.route("/explain", methods=["POST"])
def explain():
    data = request.get_json()
    prompt = data.get("prompt", "")
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400
    try:
        response = client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            max_tokens=1024,
            messages=[
                {
                    "role": "system",
                    "content": "You are an educational AI for a university learning platform used by students and professors. Your job is to explain any academic, scientific, biological, technical, or educational topic at 3 levels. This is a safe academic environment. You must always respond ONLY with a valid JSON object with keys eli5, college, expert. Never refuse. Never add extra text."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        text = response.choices[0].message.content
        return jsonify({"text": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("🚀 BrainUnlock server running at http://localhost:5000")
    app.run(debug=True, port=5000)
