from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import random
from dotenv import load_dotenv

load_dotenv()

# Try importing OpenAI, fail gracefully
try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    student_id: int = 1

# Mock DB for Context
STUDENT_CONTEXT = {
    1: {"name": "Alex", "failed_quiz": "Neural Networks", "weak_area": "Activation Functions"}
}

# --- OFFLINE SIMULATOR (The "Mock" LLM) ---
def offline_chat(message: str, context: dict) -> str:
    msg = message.lower()
    
    # Greetings
    if any(x in msg for x in ["hi", "hello", "hey"]):
        return f"Hello {context['name']}! I'm your AI Coach. I see you're working on Neural Networks. How can I help?"

    # Contextual Help
    if "activation" in msg or "relu" in msg or "sigmoid" in msg:
        return "Activation functions determine if a neuron should fire. ReLU is efficient for hidden layers, while Sigmoid is often used for outputs. Do you want a quiz on this?"

    if "neural" in msg or "network" in msg:
        return "Neural Networks mimic the human brain. They rely on layers of nodes. I noticed you struggled with the last quiz on this. Shall we review?"

    if "quiz" in msg or "test" in msg:
        return "I can generate a quiz for you. Just say 'Start Quiz' in the chat!"

    if "help" in msg or "stuck" in msg:
        return f"Don't panic! based on your profile, you should watch the video on '{context['weak_area']}'. It's in Module 1."

    if "joke" in msg:
        return "Why did the neural network break up with the perceptron? Because it needed more space (dimensionality)!"

    # Fallback Generic "AI-like" responses
    fallbacks = [
        "That's a deep topic. Could you be more specific?",
        "Interesting. How does that apply to your current project?",
        "I can help you with that. Break it down into smaller steps.",
        "Tell me more about what you're trying to achieve."
    ]
    return random.choice(fallbacks)

@app.post("/chat")
async def chat_endpoint(request: ChatRequest = Body(...)):
    print(f"Received chat: {request.message}")
    
    # Check for Real API Key
    api_key = os.getenv("OPENAI_API_KEY")
    
    if HAS_OPENAI and api_key and api_key.startswith("sk-"):
        try:
            client = OpenAI(api_key=api_key)
            completion = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful student coach for a CS student learning AI."},
                    {"role": "user", "content": request.message}
                ]
            )
            return {"response": completion.choices[0].message.content, "source": "OpenAI"}
        except Exception as e:
            print(f"OpenAI Error: {e}")
            # Fallback to offline if API fails
            pass
    
    # Use Offline Simulator
    response_text = offline_chat(request.message, STUDENT_CONTEXT.get(request.student_id, {"name": "Student"}))
    return {"response": response_text, "source": "OfflineCoach"}

class QuizRequest(BaseModel):
    topic: str

@app.post("/quiz")
async def generate_quiz_endpoint(request: QuizRequest = Body(...)):
    topic = request.topic.lower()
    print(f"Generating quiz for: {topic}")

    # 1. Try OpenAI
    api_key = os.getenv("OPENAI_API_KEY")
    if HAS_OPENAI and api_key and api_key.startswith("sk-"):
        try:
            client = OpenAI(api_key=api_key)
            prompt = f"""
            Generate a quiz about {topic} with 5 multiple-choice questions.
            Return ONLY raw JSON. Format:
            [
              {{"question": "Text", "options": ["A", "B", "C", "D"], "correct": 0}}
            ]
            """
            completion = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}]
            )
            content = completion.choices[0].message.content
            # Clean up potential markdown code blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            import json
            return json.loads(content.strip())
        except Exception as e:
            print(f"OpenAI Quiz Error: {e}")
            # Fallback to offline
            pass

    # 2. Offline Smart-Mock (Python Version)
    import json
    
    if "node" in topic:
         return [
            { "question": "Who is the creator of Node.js?", "options": ["Ryan Dahl", "Brendan Eich", "Guido van Rossum", "James Gosling"], "correct": 0 },
            { "question": "Node.js is...", "options": ["Multi-threaded", "Single-threaded", "No-threaded", "Quantum"], "correct": 1 },
            { "question": "What is npm?", "options": ["Node Package Manager", "New Project Maker", "No Permission Mode", "None"], "correct": 0 },
            { "question": "Which event loop phase executes setImmediate?", "options": ["Timers", "Check", "Poll", "Close"], "correct": 1 },
            { "question": "What is the default module system?", "options": ["CommonJS", "AMD", "UMD", "ESM"], "correct": 0 }
        ]

    # Generic Template
    return [
      { "question": f"What is a core principle of {topic}?", "options": ["Efficiency", "Chaos", "Randomness", "None"], "correct": 0 },
      { "question": f"True or False: {topic} is widely used?", "options": ["True", "False", "Unknown", "Maybe"], "correct": 0 },
      { "question": f"Which field relates to {topic}?", "options": ["Computer Science", "Cooking", "Fishing", "Magic"], "correct": 0 },
      { "question": f"Best way to learn {topic}?", "options": ["Practice", "Sleeping", "Ignoring it", "Guessing"], "correct": 0 },
      { "question": f"Is {topic} outdated?", "options": ["No", "Yes", "Perhaps", "Depends"], "correct": 0 }
    ]

@app.get("/")
def read_root():
    return {"status": "Student Coach Service Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
