// auth.js
export async function requireLogin() {
  try {
    const res = await fetch("https://dppage.onrender.com/auth/check", {
      credentials: "include"
    });
    if (!res.ok) throw new Error("not logged");
    return await res.json();
  } catch (e) {
    window.location.href = "login.html"; // přesměrování
    return new Promise(() => {}); // nikdy se nevyřeší → zamezí dalšímu vykreslování
  }
}
