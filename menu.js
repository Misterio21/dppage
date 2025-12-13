// menu.js
export function initMenu() {
  const current = window.location.pathname.split("/").pop();

  document.querySelectorAll(".menu-item").forEach(item => {
    const link = item.getAttribute("href");
    if (link === current) item.classList.add("active");
  });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      try {
        // přidán port 3000 k URL
        const res = await fetch("https://dppage.onrender.com/logout", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        });

        if (!res.ok) throw new Error("Odhlášení selhalo na serveru.");

        window.location.href = "index.html";
      } catch (err) {
        alert("Odhlášení selhalo: " + err.message);
      }
    };
  }
}
