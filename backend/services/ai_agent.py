import os
import json
import asyncio
import google.generativeai as genai
from models.domain import AIAgentLog, LicenseKey, Application, EndUser
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone

def utc_now(): return datetime.now(timezone.utc)

async def process_natural_language_command(command: str, dev_id: int, context: dict, db: AsyncSession):
    # Get developer context
    res = await db.execute(select(Application).where(Application.developer_id == dev_id))
    apps = res.scalars().all()
    app_context = [{"id": a.id, "name": a.name} for a in apps]
    
    system_prompt = f"""
    You are an AI assistant for AuthSys. Your job is to manage the software platform for a developer.
    Developer Apps: {json.dumps(app_context)}
    
    Available Actions:
    1. generate_keys(app_id, count, duration_days, key_type='time')
    2. ban_user(user_id, reason)
    3. unban_user(user_id)
    4. temp_ban_user(user_id, hours, reason)
    5. hwid_reset(user_id)
    6. extend_subscription(user_id, days)
    7. get_analytics(app_id)
    8. search_users(app_id, query)
    9. blacklist_ip(app_id, ip, reason)
    
    You must ALWAYS return strict JSON with this exact schema and no markdown formatting:
    {{
      "action": "string (the function name or 'clarify')",
      "params": {{}},
      "confirmation_required": boolean,
      "human_response": "What you tell the user"
    }}
    
    Example: "Generate 5 keys for my app atik"
    Response: {{
      "action": "generate_keys",
      "params": {{"app_id": 1, "count": 5, "duration_days": 30}},
      "confirmation_required": true,
      "human_response": "I will generate 5 keys for your app 'atik' for 30 days. Shall I proceed?"
    }}
    """
    
    api_key = os.getenv("GEMINI_API_KEY")
    
    try:
        if api_key:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            # Combine system prompt with command
            full_prompt = f"{system_prompt}\n\nUser Command: {command}"
            
            response = await asyncio.to_thread(model.generate_content, full_prompt)
            raw_json = response.text.strip()
            
            # Clean up potential markdown code blocks
            if raw_json.startswith("```json"):
                raw_json = raw_json.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_json:
                raw_json = raw_json.split("```")[1].split("```")[0].strip()
        else:
            raw_json = json.dumps({
                "action": "clarify", 
                "params": {}, 
                "confirmation_required": False, 
                "human_response": "Gemini API key missing in environment. Please add GEMINI_API_KEY to your .env file."
            })
            
        action_plan = json.loads(raw_json)
        
    except Exception as e:
        print(f"AI Agent Error: {str(e)}")
        action_plan = {
            "action": "error",
            "params": {},
            "confirmation_required": False,
            "human_response": f"I encountered an error: {str(e)}"
        }

    # Log the interaction
    log = AIAgentLog(
        developer_id=dev_id,
        command_text=command,
        action_taken=action_plan.get("action", "unknown"),
        result=action_plan
    )
    db.add(log)
    await db.commit()
    
    return {
        "action": action_plan.get("action"), 
        "details": action_plan.get("human_response"), 
        "success": True, 
        "params": action_plan.get("params")
    }
