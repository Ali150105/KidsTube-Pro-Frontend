// Log para verificar que handleCredentialResponse está definido
console.log('handleCredentialResponse defined:', typeof window.handleCredentialResponse);

// Manejar el registro manual
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const phoneNumber = document.getElementById('phoneNumber').value;
  const pin = document.getElementById('pin').value;
  const name = document.getElementById('name').value;
  const lastName = document.getElementById('lastName').value;
  const country = document.getElementById('country').value;
  const birthDate = document.getElementById('birthDate').value;

  if (password !== confirmPassword) {
    document.getElementById('message').innerText = 'Las contraseñas no coinciden';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, phoneNumber, pin, name, lastName, country, birthDate })
    });

    const data = await response.json();
    if (response.ok) {
      document.getElementById('message').innerText = 'Cuenta creada exitosamente. Redirigiendo al login...';
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 3000);
    } else {
      document.getElementById('message').innerText = data.message || 'Error al registrarse';
    }
  } catch (error) {
    console.error('Error en registro manual:', error);
    document.getElementById('message').innerText = 'Error de conexión';
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
      document.getElementById('codeMessage').innerText = 'Cuenta creada exitosamente. Redirigiendo al login...';
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 3000);
    } else {
      document.getElementById('codeMessage').innerText = data.message || 'Código incorrecto';
    }
  } catch (error) {
    console.error('Error en verificación de código:', error);
    document.getElementById('codeMessage').innerText = 'Error de conexión';
  }
});