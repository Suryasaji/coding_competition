from flask import Flask, request, jsonify
import google.generativeai as genai
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes to allow requests from your web app

# Configure the Gemini API
API_KEY = "AIzaSyARy7VrUJi-8Gkmn6U7j-pT1xJNIcxIruo"  # Replace with your actual API key
genai.configure(api_key=API_KEY)

@app.route('/api/ask-gemini', methods=['POST'])
def ask_gemini():
    try:
        data = request.json
        query = data.get('query', '')
        
        if not query:
            return jsonify({"error": "No query provided"}), 400
        
        # Initialize the Gemini model
        model = genai.GenerativeModel('gemini-pro')
        
        # Generate content
        response = model.generate_content(query)
        
        return jsonify({
            "success": True,
            "response": response.text
        })
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)