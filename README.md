# Marine Biodiversity AI Chatbot

A responsive marine-conservation chatbot inspired by the supplied design reference. It includes a floating chat widget, quick prompt buttons, a FastAPI backend, a server-side Groq API connection, and an organization knowledge file.

## Important: API key security

The Groq key belongs only in the backend `.env` file. Do not paste it into `static/*.js`, HTML, GitHub, or a public website. If a key was shared in a screenshot or chat, revoke it and create a new one.

## 1. Run locally on Windows / VS Code

Open PowerShell in this project folder. If your terminal is elsewhere, use `cd` with the actual extracted folder path.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Open `.env` and replace `your_groq_api_key_here` with a new key from <https://console.groq.com/keys>. The default model is `openai/gpt-oss-120b`; check your Groq account's model availability if you need to change it.

Run the app:

```powershell
python -m uvicorn main:app --reload
```

Open <http://127.0.0.1:8000>. API health check: <http://127.0.0.1:8000/api/health>. Interactive API docs: <http://127.0.0.1:8000/docs>.

## 2. Website integration

Deploy this FastAPI project to a public HTTPS server first. The chat API and widget must be reachable online; `127.0.0.1` works only on your own computer.

### Option A — simplest, same-domain deployment

If your website and chatbot are served from the same domain, add this script before `</body>`:

```html
<script src="https://YOUR-CHATBOT-HOST/static/embed.js"></script>
```

### Option B — website and chatbot use different domains

Use the chatbot's full public URL in the `data-chatbot-url` attribute:

```html
<script src="https://YOUR-CHATBOT-HOST/static/embed.js" data-chatbot-url="https://YOUR-CHATBOT-HOST"></script>
```

The `data-chatbot-url` value must be the base URL of the deployed FastAPI app (no trailing slash required). The embed script creates a small floating iframe and expands it when the chat opens. It does not replace the host website.

## 3. Customize organization facts

Edit `data/marine_knowledge.json` to update verified mission, programs, contact information, and FAQs. Restart the server after editing. Keep factual claims accurate and current.

## Project structure

```text
marinebot_project/
├── main.py                 # FastAPI routes and Groq API call
├── requirements.txt
├── .env.example            # Copy to .env; add private API key
├── .gitignore
├── data/
│   └── marine_knowledge.json
└── static/
    ├── index.html          # Local demo page
    ├── site.css
    ├── widget.html         # Chat widget document
    ├── widget.css
    ├── widget.js           # Chat UI behavior
    ├── embed.js            # Website embed loader
    └── sea-mark.svg        # Original simple marine icon
```

## Troubleshooting

- **API not configured:** verify `.env` is in the project root beside `main.py`; restart Uvicorn after changing it.
- **401 from Groq:** replace the key with a valid active key. Do not use a key that was posted or shared.
- **429 / rate limit:** wait briefly or review your Groq account limits.
- **Widget opens but no answer:** keep the Uvicorn terminal running and check `/api/health`.
- **Production:** use HTTPS, set a valid secret key, and consider adding rate limiting and usage monitoring before public launch.

This starter is designed for a functional demo. Before a high-traffic production launch, add server-side rate limiting, logging/monitoring, privacy notice, and abuse protection.
