(() => {
  const script = document.currentScript;
  const configured = (script && script.dataset.chatbotUrl || "").trim();
  const base = (configured || new URL("../", script.src).href).replace(/\/$/, "");
  const frame = document.createElement("iframe");
  frame.title = "Marine Biodiversity AI Assistant";
  frame.src = base + "/widget";
  frame.allow = "clipboard-write";
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:270px;height:180px;border:0;z-index:2147483000;pointer-events:auto;background:transparent;";
  frame.setAttribute("allowtransparency", "true");
  document.body.appendChild(frame);
  window.addEventListener("message", event => {
    if (event.source !== frame.contentWindow || !event.data || event.data.type !== "MARINEBOT_RESIZE") return;
    const mobile = window.matchMedia("(max-width: 600px)").matches;
    if (event.data.open) {
      frame.style.width = mobile ? "100vw" : "470px";
      frame.style.height = mobile ? "100vh" : "820px";
    } else {
      frame.style.width = "270px";
      frame.style.height = "180px";
    }
  });
  const openButton = document.getElementById("openAssistant");
  if (openButton) openButton.addEventListener("click", () => frame.contentWindow.postMessage({ type: "MARINEBOT_OPEN" }, "*"));
})();
