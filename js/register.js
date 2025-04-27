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
      document.getElementById('message').innerText = 'Registro exitoso. Revisa tu correo para verificar tu cuenta.';
    } else {
      document.getElementById('message').innerText = data.message || 'Error al registrarse';
    }
  } catch (error) {
    document.getElementById('message').innerText = 'Error de conexión';
  }
});