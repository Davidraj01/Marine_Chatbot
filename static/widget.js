(() => {
  const panel = document.getElementById("chatPanel");
  const launcher = document.getElementById("launcher");
  const closeButton = document.getElementById("closeChat");
  const minimizeButton = document.getElementById("minimize");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("messageInput");
  const messages = document.getElementById("messages");
  const sendButton = document.getElementById("sendButton");
  const quickPrompts = document.getElementById("quickPrompts");
  const history = [];
  let busy = false;

  function setOpen(open) {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "MARINEBOT_RESIZE", open }, "*");
    }
    panel.classList.toggle("open", open);
    panel.setAttribute("aria-hidden", String(!open));
    launcher.setAttribute("aria-expanded", String(open));
    launcher.style.opacity = open ? "0" : "1";
    launcher.style.pointerEvents = open ? "none" : "auto";
    if (open) setTimeout(() => input.focus(), 180);
  }
  launcher.addEventListener("click", () => setOpen(true));
  closeButton.addEventListener("click", () => setOpen(false));
  minimizeButton.addEventListener("click", () => setOpen(false));
  window.addEventListener("message", event => {
    if (event.data && event.data.type === "MARINEBOT_OPEN") setOpen(true);
  });

  function addMessage(role, text, extraClass = "") {
    const row = document.createElement("div");
    row.className = `message-row ${role === "user" ? "user-row" : "bot-row"}`;
    if (role === "assistant") {
      const avatar = document.createElement("img");
      avatar.className = "message-avatar";
      avatar.src = "/static/Marine%20AI%20Assistant%20Avatar.png";
      avatar.alt = "";
      row.appendChild(avatar);
    }
    const bubble = document.createElement("div");
    bubble.className = `bubble ${role === "user" ? "user-bubble" : "bot-bubble"} ${extraClass}`;
    bubble.textContent = text;
    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  function setBusy(value) {
    busy = value;
    sendButton.disabled = value;
    input.disabled = value;
    sendButton.innerHTML = value ? "<span class='spinner' aria-hidden='true'></span>" : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20.5 21 12 3 3.5l2.2 6.8L15 12l-9.8 1.7L3 20.5Z"/></svg>';
  }

  async function sendMessage(raw) {
    const text = raw.trim();
    if (!text || busy) return;
    addMessage("user", text);
    history.push({ role: "user", content: text });
    if (history.length > 16) history.splice(0, history.length - 16);
    input.value = "";
    input.style.height = "auto";
    quickPrompts.style.display = "none";
    const typing = addMessage("assistant", "Exploring the ocean of knowledge…", "typing");
    setBusy(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.detail || "The assistant could not respond. Please try again.");
      const reply = String(result.reply || "I couldn't form a reply just now. Please try again.");
      typing.remove();
      addMessage("assistant", reply);
      history.push({ role: "assistant", content: reply });
      if (history.length > 16) history.splice(0, history.length - 16);
    } catch (error) {
      typing.remove();
      addMessage("assistant", error.message || "Connection problem. Check that the server is running and try again.", "error-bubble");
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    sendMessage(input.value);
  });
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 110) + "px";
  });
  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  quickPrompts.addEventListener("click", event => {
    const button = event.target.closest("button[data-prompt]");
    if (button) sendMessage(button.dataset.prompt);
  });
})();
