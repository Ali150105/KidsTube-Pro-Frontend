function Submit() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return response.json().then(data => {
                    throw new Error(data.error);
                });
            }
        })
        .then(data => {
            // Guardar el token JWT en el almacenamiento local para usarlo en las solicitudes posteriores
            localStorage.setItem('token', data.token);
            // Redireccionar a la página de inicio o realizar otras acciones necesarias
            window.location.href = '/inicio.html';
        })
        .catch(error => {
            alert('Usuario o constraseña invalida');
        });
}

function redirectToRegistration() {
    window.location.href = '/register.html';
}