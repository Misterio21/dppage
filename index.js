(() => {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const pwdInput = document.getElementById('password');
  const rememberChk = document.getElementById('remember');
  const togglePwdBtn = document.getElementById('togglePassword');
  const serverMessage = document.getElementById('server-message');
  const submitBtn = document.getElementById('submitBtn');

  const saved = localStorage.getItem('rememberedEmail');
  if (saved) {
    emailInput.value = saved;
    rememberChk.checked = true;
  }

  togglePwdBtn.addEventListener('click', () => {
    const type = pwdInput.type === 'password' ? 'text' : 'password';
    pwdInput.type = type;
    togglePwdBtn.textContent = type === 'text' ? '🙈' : '👁️';
  });

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function showError(input, message) {
    const err = document.getElementById(`${input.id}-error`);
    err.textContent = message || '';
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  // ------------- LOGIN S BACKENDEM -------------
  async function loginRequest(email, password) {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    return res.json();
  }

  form.addEventListener('submit', async (e) => {
  e.preventDefault();

  showError(emailInput, '');
  showError(pwdInput, '');
  serverMessage.textContent = '';

  const email = emailInput.value.trim();
  const password = pwdInput.value;

  let valid = true;
  if (!email) { showError(emailInput, 'E-mail je povinný.'); valid = false; }
  else if (!validateEmail(email)) { showError(emailInput, 'Zadejte platný e-mail.'); valid = false; }

  if (!password) { showError(pwdInput, 'Heslo je povinné.'); valid = false; }

  if (!valid) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Probíhá ověření…';

  try {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // důležité pro cookie
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      window.location.href = "mainpage.html";
    } else {
      serverMessage.style.color = 'var(--danger)';
      serverMessage.textContent = data.message || "Chyba přihlášení.";
    }

  } catch (err) {
    serverMessage.style.color = 'var(--danger)';
    serverMessage.textContent = "Chyba serveru.";
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Přihlásit se';
  }
});

})();
