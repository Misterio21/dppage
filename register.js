(() => {
  const form = document.getElementById("register-form");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const pwdInput = document.getElementById("password");
  const togglePwdBtn = document.getElementById("togglePassword");
  const serverMessage = document.getElementById("server-message");

  // Zobrazení / skrytí hesla
  togglePwdBtn.addEventListener("click", () => {
    pwdInput.type = pwdInput.type === "password" ? "text" : "password";
    togglePwdBtn.textContent = pwdInput.type === "text" ? "🙈" : "👁️";
  });

  function showError(input, message) {
    document.getElementById(`${input.id}-error`).textContent = message;
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    serverMessage.textContent = "";

    let valid = true;
    showError(nameInput, "");
    showError(emailInput, "");
    showError(pwdInput, "");

    if (!nameInput.value.trim()) {
      showError(nameInput, "Jméno je povinné.");
      valid = false;
    }

    if (!validateEmail(emailInput.value.trim())) {
      showError(emailInput, "Zadejte platný email.");
      valid = false;
    }

    if (pwdInput.value.length < 4) {
      showError(pwdInput, "Heslo musí mít alespoň 4 znaky.");
      valid = false;
    }

    if (!valid) return;

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      password: pwdInput.value.trim()
    };

    try {
      const res = await fetch("https://dppage.onrender.com/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        serverMessage.style.color = "var(--accent)";
        serverMessage.textContent = "Účet byl úspěšně vytvořen!";
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
