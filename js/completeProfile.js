document.getElementById('completeProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const token = localStorage.getItem('tempToken');
    const phoneNumber = document.getElementById('phoneNumber').value;
    const pin = document.getElementById('pin').value;
    const country = document.getElementById('country').value;
    const birthDate = document.getElementById('birthDate').value;
  
    try {
      const response = await fetch('http://localhost:3000/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, phoneNumber, pin, country, birthDate })
      });
  
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.removeItem('tempToken');
        document.getElementById('message').innerText = 'Cuenta creada exitosamente. Redirigiendo al login...';
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 3000);
      } else {
        document.getElementById('message').innerText = data.message || 'Error al completar el perfil';
      }
    } catch (error) {
      console.error('Error al completar el perfil:', error);
      document.getElementById('message').innerText = 'Error de conexión';
    }
  });