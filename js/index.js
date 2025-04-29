// Log para verificar que handleCredentialResponse está definido
console.log('handleCredentialResponse defined:', typeof window.handleCredentialResponse);

// Manejar el login manual
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
        localStorage.setItem('pendingEmail', email);
      } else {
        document.getElementById('message').innerText = data.message || 'Error al iniciar sesión';
      }
    } catch (error) {
      console.error('Error en login manual:', error);
      document.getElementById('message').innerText = 'Error de conexión';
    }
});

// Verificar el código SMS
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
      console.error('Error en verificación de código:', error);
      document.getElementById('codeMessage').innerText = 'Error de conexión';
    }
});

// Manejar la respuesta de Google
window.handleCredentialResponse = async (response) => {
    console.log('Google Sign-In Response:', response); // Log para depurar
    try {
        const res = await fetch('http://localhost:3000/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential })
        });

        const data = await res.json();
        console.log('Backend Response:', data); // Log para depurar
        if (res.ok) {
            if (data.redirect) {
                // Redirigir a completar perfil
                localStorage.setItem('tempToken', data.tempToken);
                window.location.href = data.redirect;
            } else {
                // Mostrar modal de 2FA
                document.getElementById('message').innerText = data.message;
                document.getElementById('codeModal').style.display = 'block';
                localStorage.setItem('pendingEmail', data.email);
            }
        } else {
            document.getElementById('message').innerText = data.message || 'Error al autenticar con Google';
        }
    } catch (error) {
        console.error('Error en fetch a /auth/google:', error);
        document.getElementById('message').innerText = 'Error de conexión';
    }
};