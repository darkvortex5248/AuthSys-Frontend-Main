"""Shared Google Gemini chat generation for dashboard AI + agent."""

from __future__ import annotations

import google.generativeai as genai

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


async def generate_chat_response(
    *,
    api_key: str,
    model_name: str,
    messages: list[dict],
    system_instruction: str = SYSTEM_PROMPT,
) -> str:
    if not api_key:
        raise ValueError("AI API key is not configured. Set it in Admin → AI Control.")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name=model_name,
        system_instruction=system_instruction,
    )

    contents = []
    for msg in messages:
        role = "user" if msg.get("role") == "user" else "model"
        contents.append({"role": role, "parts": [msg.get("content", "")]})

    response = await model.generate_content_async(contents)
    if response and response.text:
        return response.text.strip()
    return "I'm sorry, I couldn't generate a response. Please try again."


async def list_available_models(api_key: str) -> list[str]:
    if not api_key:
        return []
    genai.configure(api_key=api_key)
    names: list[str] = []
    for m in genai.list_models():
        name = getattr(m, "name", "") or ""
        methods = getattr(m, "supported_generation_methods", []) or []
        if "generateContent" in methods:
            short = name.replace("models/", "", 1) if name.startswith("models/") else name
            if short and short not in names:
                names.append(short)
    return sorted(names)[:40]
