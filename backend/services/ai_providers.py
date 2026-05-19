"""Multi-provider AI: Google Gemini, OpenAI, Anthropic, Groq, OpenRouter, custom OpenAI-compatible."""

from __future__ import annotations

import httpx

PROVIDER_CATALOG: dict[str, dict] = {
    "google": {
        "label": "Google Gemini",
        "default_model": "gemini-2.0-flash",
        "models": [
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-pro",
            "gemini-1.5-flash",
            "gemini-1.5-flash-8b",
        ],
        "key_hint": "AI Studio API key",
        "docs": "https://aistudio.google.com/apikey",
    },
    "openai": {
        "label": "OpenAI",
        "default_model": "gpt-4o-mini",
        "models": [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-turbo",
            "gpt-3.5-turbo",
            "o1-mini",
            "o1-preview",
        ],
        "key_hint": "OpenAI API key",
        "docs": "https://platform.openai.com/api-keys",
    },
    "anthropic": {
        "label": "Anthropic Claude",
        "default_model": "claude-3-5-sonnet-latest",
        "models": [
            "claude-3-5-sonnet-latest",
            "claude-3-5-haiku-latest",
            "claude-3-opus-latest",
            "claude-3-haiku-latest",
        ],
        "key_hint": "Anthropic API key",
        "docs": "https://console.anthropic.com/",
    },
    "groq": {
        "label": "Groq",
        "default_model": "llama-3.3-70b-versatile",
        "models": [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "mixtral-8x7b-32768",
            "gemma2-9b-it",
        ],
        "key_hint": "Groq API key",
        "docs": "https://console.groq.com/keys",
    },
    "openrouter": {
        "label": "OpenRouter",
        "default_model": "google/gemini-2.0-flash-exp:free",
        "models": [
            "google/gemini-2.0-flash-exp:free",
            "openai/gpt-4o-mini",
            "anthropic/claude-3.5-sonnet",
            "meta-llama/llama-3.3-70b-instruct",
        ],
        "key_hint": "OpenRouter API key",
        "docs": "https://openrouter.ai/keys",
    },
    "custom": {
        "label": "Custom (OpenAI-compatible)",
        "default_model": "gpt-4o-mini",
        "models": [],
        "key_hint": "API key for your endpoint",
        "docs": "",
    },
}

SYSTEM_PROMPT = """You are the official AuthSys AI assistant.
Only answer questions related to authentication, licenses, HWID, dashboard, API usage, security, and user management.
If unrelated, politely refuse. Be professional and brief."""


def catalog_for_admin() -> list[dict]:
    return [
        {
            "id": pid,
            "label": meta["label"],
            "default_model": meta["default_model"],
            "models": meta["models"],
            "key_hint": meta["key_hint"],
            "docs": meta.get("docs", ""),
        }
        for pid, meta in PROVIDER_CATALOG.items()
    ]


def default_models_for(provider: str) -> list[str]:
    meta = PROVIDER_CATALOG.get(provider, PROVIDER_CATALOG["google"])
    return list(meta["models"])


async def list_live_models(*, provider: str, api_key: str, base_url: str = "") -> list[str]:
    provider = (provider or "google").lower()
    if not api_key:
        return default_models_for(provider)

    try:
        if provider == "google":
            import google.generativeai as genai

            genai.configure(api_key=api_key)
            names: list[str] = []
            for m in genai.list_models():
                name = getattr(m, "name", "") or ""
                methods = getattr(m, "supported_generation_methods", []) or []
                if "generateContent" in methods:
                    short = name.replace("models/", "", 1) if name.startswith("models/") else name
                    if short and short not in names:
                        names.append(short)
            return sorted(names)[:60] or default_models_for(provider)

        if provider == "openai":
            async with httpx.AsyncClient(timeout=30) as client:
                r = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {api_key}"},
                )
                r.raise_for_status()
                ids = [m["id"] for m in r.json().get("data", []) if "gpt" in m.get("id", "") or "o1" in m.get("id", "")]
                return sorted(set(ids))[:60] or default_models_for(provider)

        if provider == "groq":
            async with httpx.AsyncClient(timeout=30) as client:
                r = await client.get(
                    "https://api.groq.com/openai/v1/models",
                    headers={"Authorization": f"Bearer {api_key}"},
                )
                r.raise_for_status()
                ids = [m["id"] for m in r.json().get("data", [])]
                return sorted(ids)[:60] or default_models_for(provider)

        if provider == "openrouter":
            async with httpx.AsyncClient(timeout=30) as client:
                r = await client.get(
                    "https://openrouter.ai/api/v1/models",
                    headers={"Authorization": f"Bearer {api_key}"},
                )
                r.raise_for_status()
                ids = [m["id"] for m in r.json().get("data", [])][:80]
                return sorted(set(ids)) or default_models_for(provider)

        if provider == "anthropic":
            return default_models_for(provider)

        if provider == "custom" and base_url:
            url = base_url.rstrip("/") + "/models"
            async with httpx.AsyncClient(timeout=30) as client:
                r = await client.get(url, headers={"Authorization": f"Bearer {api_key}"})
                if r.status_code == 200:
                    data = r.json().get("data", r.json())
                    if isinstance(data, list):
                        return [m.get("id", m) if isinstance(m, dict) else str(m) for m in data][:60]
    except Exception:
        pass

    return default_models_for(provider)


async def generate_chat_response(
    *,
    provider: str,
    api_key: str,
    model_name: str,
    messages: list[dict],
    system_instruction: str = SYSTEM_PROMPT,
    base_url: str = "",
) -> str:
    if not api_key:
        raise ValueError("AI API key is not configured. Set it in Admin → AI Control.")

    provider = (provider or "google").lower()
    model_name = (model_name or "").replace("models/", "", 1)
    if not model_name:
        model_name = PROVIDER_CATALOG.get(provider, PROVIDER_CATALOG["google"])["default_model"]

    user_messages = [m for m in messages if m.get("role") == "user"]
    last_user = user_messages[-1]["content"] if user_messages else "Hello"

    if provider == "google":
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name=model_name, system_instruction=system_instruction)
        contents = []
        for msg in messages:
            role = "user" if msg.get("role") == "user" else "model"
            contents.append({"role": role, "parts": [msg.get("content", "")]})
        response = await model.generate_content_async(contents)
        if response and response.text:
            return response.text.strip()
        return "I'm sorry, I couldn't generate a response."

    if provider == "anthropic":
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=api_key)
        msg = await client.messages.create(
            model=model_name,
            max_tokens=1024,
            system=system_instruction,
            messages=[{"role": "user", "content": last_user}],
        )
        if msg.content and msg.content[0].text:
            return msg.content[0].text.strip()
        return "No response from Claude."

    # OpenAI-compatible: openai, groq, openrouter, custom
    endpoints = {
        "openai": "https://api.openai.com/v1/chat/completions",
        "groq": "https://api.groq.com/openai/v1/chat/completions",
        "openrouter": "https://openrouter.ai/api/v1/chat/completions",
    }
    url = endpoints.get(provider)
    if provider == "custom":
        base = (base_url or "").rstrip("/")
        if not base:
            raise ValueError("Custom provider requires Base URL (e.g. https://api.example.com/v1)")
        url = base if base.endswith("/chat/completions") else f"{base}/chat/completions"

    if not url:
        raise ValueError(f"Unsupported provider: {provider}")

    oai_messages = [{"role": "system", "content": system_instruction}]
    for m in messages:
        role = "assistant" if m.get("role") == "model" else "user"
        oai_messages.append({"role": role, "content": m.get("content", "")})

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    if provider == "openrouter":
        headers["HTTP-Referer"] = "https://authsys.app"
        headers["X-Title"] = "AuthSys"

    payload = {"model": model_name, "messages": oai_messages, "max_tokens": 1024}

    async with httpx.AsyncClient(timeout=90) as client:
        r = await client.post(url, headers=headers, json=payload)
        if r.status_code >= 400:
            err = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
            detail = err.get("error", {}).get("message", r.text[:200])
            raise ValueError(detail or f"HTTP {r.status_code}")
        data = r.json()
        choices = data.get("choices") or []
        if choices:
            content = choices[0].get("message", {}).get("content", "")
            if content:
                return content.strip()
    return "I'm sorry, I couldn't generate a response."
