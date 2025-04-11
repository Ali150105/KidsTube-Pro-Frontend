document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const repeatPassword = document.getElementById('repeatPassword').value;
        const pin = document.getElementById('pin').value;
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const country = document.getElementById('country').value;
        const dateOfBirth = document.getElementById('dateOfBirth').value;

        // Validaciones
        if (password !== repeatPassword) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        if (!/^\d{6}$/.test(pin)) {
            alert('El PIN debe contener exactamente 6 números.');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, pin, firstName, lastName, country, dateOfBirth })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Usuario registrado exitosamente.');
                window.location.href = '/index.html';
            } else {
                alert(data.error || 'Error al registrar el usuario.');
            }
        } catch (error) {
            console.error('Error en el registro:', error);
            alert('Hubo un error al procesar la solicitud.');
        }
    });
});