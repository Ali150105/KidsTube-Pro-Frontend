document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
  
      const data = await response.json();
      if (response.ok) {
        document.getElementById('message').innerText = data.message;
        document.getElementById('codeModal').style.display = 'block';
        localStorage.setItem('pendingEmail', email); // Guardar email temporalmente
      } else {
        document.getElementById('message').innerText = data.message || 'Error al iniciar sesión';
      }
    } catch (error) {
      document.getElementById('message').innerText = 'Error de conexión';
    }
  });
  
  document.getElementById('verifyCodeBtn').addEventListener('click', async () => {
    const email = localStorage.getItem('pendingEmail');
    const code = document.getElementById('verificationCode').value;
  
    try {
      const response = await fetch('http://localhost:3000/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
  
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.removeItem('pendingEmail');
        window.location.href = 'inicio.html';
      } else {
        document.getElementById('codeMessage').innerText = data.message || 'Código incorrecto';
      }
    } catch (error) {
      document.getElementById('codeMessage').innerText = 'Error de conexión';
    }
  });