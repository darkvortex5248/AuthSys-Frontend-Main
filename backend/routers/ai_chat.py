from fastapi import APIRouter, Depends, HTTPException
import google.generativeai as genai
from core.config import settings
from core.deps import get_current_developer
from models.domain import DeveloperAccount
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/v1/ai", tags=["AI"])

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

SYSTEM_PROMPT = """You are the official AuthSys AI assistant.

Only answer questions related to:
* Authentication
* Licenses
* HWID
* Dashboard
* API usage
* Security
* User management

If the user asks unrelated questions, politely refuse.
Always answer professionally and briefly."""

class ChatMessage(BaseModel):
    role: str  # 'user' or 'model'
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

@router.post("/chat")
async def ai_chat(req: ChatRequest, dev: DeveloperAccount = Depends(get_current_developer)):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="AI Key not found in .env")

    try:
        # 1. Global config (standard)
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # 2. Use gemini-1.5-flash (Best for free tier)
        # We use the simplified 'generate_content' approach which is much more stable
        model = genai.GenerativeModel(
            model_name='gemini-1.5-flash',
            system_instruction=SYSTEM_PROMPT
        )
        
        # 3. Format the conversation for the prompt
        # We'll build a single prompt or use the history list
        # Standard format for Gemini history:
        contents = []
        for msg in req.messages:
            role = "user" if msg.role == "user" else "model"
            contents.append({"role": role, "parts": [msg.content]})
        
        # 4. Generate response
        # Using async call for better performance in FastAPI
        response = await model.generate_content_async(contents)
        
        if not response or not response.text:
            return {"response": "I'm sorry, I couldn't generate a response. Please check your API key status."}

        return {"response": response.text}

    except Exception as e:
        error_msg = str(e)
        print(f"CRITICAL AI ERROR: {error_msg}")
        
        # Specific check for common free tier errors
        if "429" in error_msg:
            return {"response": "AI Rate limit reached (Free Tier). Please wait a moment."}
        if "API_KEY_INVALID" in error_msg:
            return {"response": "Invalid Gemini API Key. Please check your .env file."}
            
        # Last resort fallback (No history, just the question)
        try:
            fallback_model = genai.GenerativeModel('gemini-1.5-flash')
            res = fallback_model.generate_content(f"{SYSTEM_PROMPT}\n\nQuestion: {req.messages[-1].content}")
            return {"response": res.text}
        except:
            raise HTTPException(status_code=500, detail=f"AI Error: {error_msg}")
