(() => {
  const script = document.currentScript;
  const configured = (script && script.dataset.chatbotUrl || "").trim();
  const base = (configured || new URL("../", script.src).href).replace(/\/$/, "");
  const frame = document.createElement("iframe");
  frame.title = "Marine Biodiversity AI Assistant";
  frame.src = base + "/widget?v=4";
  frame.allow = "clipboard-write";
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:270px;height:230px;border:0;z-index:2147483000;pointer-events:auto;background:transparent;";
  frame.setAttribute("allowtransparency", "true");
  document.body.appendChild(frame);
  window.addEventListener("message", event => {
    if (event.source !== frame.contentWindow || !event.data || event.data.type !== "MARINEBOT_RESIZE") return;
    const mobile = window.matchMedia("(max-width: 600px)").matches;
    if (event.data.open) {
      const expanded = event.data.expanded === true;
      frame.style.width = mobile
        ? expanded ? "100vw" : "min(396px, 100vw)"
        : "490px";
      frame.style.height = mobile
        ? expanded ? "100vh" : "115px"
        : expanded ? "min(600px, calc(100vh - 32px))" : "115px";
      frame.style.right = expanded && !mobile ? "16px" : "0";
      frame.style.top = expanded ? "50%" : "auto";
      frame.style.bottom = expanded ? "auto" : "0";
      frame.style.transform = expanded ? "translateY(-50%)" : "none";
    } else {
      frame.style.width = "270px";
      frame.style.height = "230px";
      frame.style.right = "0";
      frame.style.top = "auto";
      frame.style.bottom = "0";
      frame.style.transform = "none";
    }
  });
  const openButton = document.getElementById("openAssistant");
  if (openButton) openButton.addEventListener("click", () => frame.contentWindow.postMessage({ type: "MARINEBOT_OPEN" }, "*"));
})();
