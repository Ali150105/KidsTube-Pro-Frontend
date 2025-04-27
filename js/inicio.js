document.addEventListener('DOMContentLoaded', function () {
    const authToken = localStorage.getItem('token');
    if (!authToken) {
        window.location.href = '/index.html';
        return;
    }

    cargarPerfiles();

    document.getElementById('administrarPerfilesBtn').addEventListener('click', function () {
        $('#adminPinModal').modal('show');
    });
});

async function cargarPerfiles() {
    const authToken = localStorage.getItem('token');
    try {
        const query = `
            query {
                profiles {
                    id
                    nombreCompleto
                    pin
                    avatar
                    edad
                }
            }
        `;

        const response = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.errors?.[0]?.message || 'Error al obtener perfiles');
        }

        const data = await response.json();
        console.log('Perfiles recibidos (GraphQL):', data.data.profiles);
        
        const perfiles = data.data.profiles;
        const contenedor = document.getElementById('contenedor-perfiles');
        contenedor.innerHTML = '';

        perfiles.forEach(perfil => {
            const col = document.createElement('div');
            col.className = 'text-muted col-6 col-sm-4 col-md-3 col-lg-2 mb-3 perfil';
            col.innerHTML = `
                <img src="${perfil.avatar}" class="img-fluid rounded mb-2 text-white" alt="Perfil de ${perfil.nombreCompleto}" data-id="${perfil.id}" data-pin="${perfil.pin}">
                <p>${perfil.nombreCompleto}</p>
            `;
            col.querySelector('img').addEventListener('click', function () {
                const userId = this.getAttribute('data-id');
                const userPin = this.getAttribute('data-pin');
                document.getElementById('pinForm').setAttribute('data-user-id', userId);
                document.getElementById('pinForm').setAttribute('data-user-pin', userPin);
                $('#pinModal').modal('show');
            });
            contenedor.appendChild(col);
        });
    } catch (error) {
        console.error('Error al cargar perfiles:', error);
        alert('Error al cargar perfiles: ' + error.message);
    }
}

document.getElementById('pinForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const userPinInput = document.getElementById('userPin').value;
    const userPinExpected = this.getAttribute('data-user-pin');
    const userId = this.getAttribute('data-user-id');

    if (userPinInput === userPinExpected) {
        $('#pinModal').modal('hide');
        alert('PIN correcto, accediendo al perfil...');
        localStorage.setItem('restrictedUserId', userId);
        window.location.href = '/mostrarVideos.html';
    } else {
        alert('PIN incorrecto, inténtalo de nuevo.');
    }
});

async function verificarAdminPin() {
    const adminPinInput = document.getElementById('adminPin').value;
    const authToken = localStorage.getItem('token');

    if (!authToken) {
        alert('No estás autenticado. Por favor, inicia sesión.');
        window.location.href = '/index.html';
        return;
    }

    if (!adminPinInput) {
        alert('Por favor, ingresa un PIN.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/auth/verificarPin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ token: authToken, userPin: adminPinInput })
        });

        const data = await response.json();

        if (response.ok) {
            alert('PIN correcto, accediendo a la administración...');
            window.location.href = '/addUser.html';
            $('#adminPinModal').modal('hide');
        } else {
            alert(data.error || 'Error al verificar el PIN');
        }
    } catch (error) {
        console.error('Error al verificar el PIN:', error);
        alert('Error de conexión. Asegúrate de que el servidor esté corriendo.');
    }
}