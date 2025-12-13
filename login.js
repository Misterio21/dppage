(() => {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const pwdInput = document.getElementById("password");
  const togglePwdBtn = document.getElementById("togglePassword");
  const serverMessage = document.getElementById("server-message");

  togglePwdBtn.addEventListener("click", () => {
    pwdInput.type = pwdInput.type === "password" ? "text" : "password";
    togglePwdBtn.textContent = pwdInput.type === "text" ? "🙈" : "👁️";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    serverMessage.textContent = "";

    const email = emailInput.value.trim();
    const password = pwdInput.value;

    if (!email || !password) {
      serverMessage.style.color = "var(--danger)";
      serverMessage.textContent = "Vyplňte email a heslo.";
      return;
    }

    try {
      const res = await fetch("https://dppage.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = "mainpage.html"; // přesměrování
      } else {
        serverMessage.style.color = "var(--danger)";
        serverMessage.textContent = data.message;
      }
    } catch (err) {
      serverMessage.style.color = "var(--danger)";
      serverMessage.textContent = "Chyba serveru.";
      console.error(err);
    }
  });
})();
