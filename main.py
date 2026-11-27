from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Literal

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")

APP_NAME = os.getenv("BOT_NAME", "Marine Biodiversity Assistant")
COMPANY_NAME = os.getenv("COMPANY_NAME", "Marine Biodiversity Conservation Trust")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def get_groq_config() -> tuple[str, str]:
    load_dotenv(ROOT / ".env", override=True)
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip()
    return api_key, model


def load_knowledge() -> str:
    path = ROOT / "data" / "marine_knowledge.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return json.dumps(data, ensure_ascii=False, indent=2)
    except (OSError, json.JSONDecodeError):
        return "No local knowledge file is available. Be honest about uncertainty."

app = FastAPI(title=APP_NAME, version="1.0.0")
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)


@app.get("/", include_in_schema=False)
async def homepage():
    return FileResponse(ROOT / "static" / "index.html")


@app.get("/widget", include_in_schema=False)
async def widget_page():
    return FileResponse(ROOT / "static" / "widget.html")


@app.get("/api/health")
async def health():
    groq_api_key, _ = get_groq_config()
    return {
        "ok": True,
        "configured": bool(groq_api_key and groq_api_key != "your_groq_api_key_here"),
        "bot_name": APP_NAME,
    }


@app.post("/api/chat")
async def chat(request: ChatRequest):
    groq_api_key, groq_model = get_groq_config()
    if not groq_api_key or groq_api_key == "your_groq_api_key_here":
        raise HTTPException(
            status_code=503,
            detail="The assistant is not configured yet. Add your Groq API key to the .env file and restart the server.",
        )

    recent_messages = [{"role": m.role, "content": m.content.strip()} for m in request.messages]
    if not recent_messages or recent_messages[-1]["role"] != "user":
        raise HTTPException(status_code=400, detail="The last message must be from the user.")

    system_prompt = f"""You are {APP_NAME}, a friendly, professional marine biodiversity and conservation assistant for {COMPANY_NAME}.
Your purpose is to help visitors understand marine animals, ocean ecosystems, conservation, education, beach cleanups, mangrove restoration, research and monitoring, volunteering, and the organization's public mission.
Use the organization facts below as your source for organization-specific claims. If a requested detail is present, answer it directly. Do not invent exact project dates, locations, staff names, donation instructions, contact details, or impact statistics. If asked for something not covered, say you don't have verified details and point them to the official website: https://www.marinebiodiversityconservation.com/.
Answer in accessible language, use short paragraphs or bullets when helpful, and be encouraging without exaggerating. Give general marine science explanations when appropriate, but distinguish general knowledge from verified organization information. Never claim to take action or register a volunteer.

ORGANIZATION / MARINE KNOWLEDGE:
{load_knowledge()}
"""
    payload = {
        "model": groq_model,
        "messages": [{"role": "system", "content": system_prompt}, *recent_messages],
        "temperature": 0.55,
        "max_completion_tokens": 700,
    }
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(45.0, connect=15.0)) as client:
            response = await client.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {groq_api_key}", "Content-Type": "application/json"},
                json=payload,
            )
        if response.status_code == 401:
            raise HTTPException(status_code=502, detail="The Groq API key was rejected. Check the key in your .env file.")
        if response.status_code == 429:
            raise HTTPException(status_code=503, detail="The AI service is temporarily rate-limited. Please try again shortly.")
        response.raise_for_status()
        body = response.json()
        answer = body["choices"][0]["message"]["content"]
        if not answer:
            raise ValueError("Empty model response")
        return {"reply": answer, "model": body.get("model", groq_model)}
    except HTTPException:
        raise
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="The AI service took too long to respond. Please try again.")
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"AI provider returned an error (HTTP {exc.response.status_code}).") from exc
    except (httpx.HTTPError, KeyError, IndexError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="Could not get a reply from the AI service. Please try again.") from exc
