
import requests

OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
MODEL_NAME = "llama3.2"


def generate_ai_response(question):
    if not question or not question.strip():
        raise ValueError("Question cannot be empty.")

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an AI course counselling assistant. "
                    "Help students understand programming, technology "
                    "and educational courses. Be friendly and concise. "
                    "Do not invent institute-specific fees, schedules, "
                    "eligibility rules or admission details. "
                    "If verified institute information is unavailable, "
                    "clearly say that you cannot confirm it."
                ),
            },
            {
                "role": "user",
                "content": question.strip(),
            },
        ],
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_predict": 200,
        },
    }

    try:
        response = requests.post(
            OLLAMA_URL,
            json=payload,
            timeout=120,
        )
        response.raise_for_status()
        result = response.json()

        answer = result.get("message", {}).get("content", "").strip()

        if not answer:
            raise RuntimeError("Ollama returned an empty response.")

        return answer

    except requests.RequestException as exc:
        raise RuntimeError(
            "Could not connect to Ollama. "
            "Check that Ollama is running and the model is available."
        ) from exc
