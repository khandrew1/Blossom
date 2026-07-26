const status = document.querySelector("#status");
const buttons = document.querySelectorAll("[data-agent]");
const lockMs = 2500;

for (const button of buttons) {
  button.addEventListener("click", async () => {
    if (button.disabled) return;
    const agent = button.dataset.agent;
    button.disabled = true;
    status.className = "";
    status.textContent = `SENDING ${agent.toUpperCase()}…`;

    try {
      const response = await fetch(`/api/send/${agent}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}"
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Send failed");
      status.className = "success";
      status.textContent = `${agent.toUpperCase()} SENT ✓`;
    } catch (error) {
      status.className = "error";
      status.textContent = `NOT SENT — ${error.message}`;
    } finally {
      window.setTimeout(() => {
        button.disabled = false;
        status.className = "";
        status.textContent = "READY";
      }, lockMs);
    }
  });
}
