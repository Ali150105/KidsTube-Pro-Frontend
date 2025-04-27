$(document).ready(function () {
    const authToken = localStorage.getItem('token');
    if (!authToken) {
        window.location.href = '/index.html';
        return;
    }

    const avatarInput = document.getElementById('avatarInput');
    const editAvatarInput = document.getElementById('editAvatarInput');

    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            previewImage(e, 'imagenSeleccionada', 'avatar');
        });
    }

    if (editAvatarInput) {
        editAvatarInput.addEventListener('change', function(e) {
            previewImage(e, 'editImagenSeleccionada', 'editAvatar');
        });
    }

    obtenerUsuarios();
});

function previewImage(event, previewId, hiddenInputId) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById(previewId);
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
            const hiddenInput = document.getElementById(hiddenInputId);
            if (hiddenInput) {
                hiddenInput.value = e.target.result;
            }
        }
        reader.readAsDataURL(file);
    }
}

const obtenerUsuarios = async () => {
    try {
        const authToken = localStorage.getItem('token');
        if (!authToken) {
            throw new Error('Token de autorización no proporcionado');
        }

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
            throw new Error(errorData.errors?.[0]?.message || 'Error al obtener usuarios');
        }

        const data = await response.json();
        console.log('Usuarios recibidos (GraphQL):', data.data.profiles);
        mostrarUsuarios(data.data.profiles);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        alert('Error al cargar usuarios: ' + error.message);
    }
};

const mostrarUsuarios = (usuarios) => {
    const listaUsuarios = document.getElementById('lista-usuarios');
    if (listaUsuarios) {
        listaUsuarios.innerHTML = '';
        if (usuarios.length === 0) {
            listaUsuarios.innerHTML = '<tr><td colspan="5">No hay usuarios registrados.</td></tr>';
            return;
        }
        usuarios.forEach(usuario => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${usuario.nombreCompleto}</td>
                <td>${usuario.pin}</td>
                <td><img src="${usuario.avatar}" style="width:50px;height:50px;"></td>
                <td>${usuario.edad}</td>
                <td>
                    <button class="btn btn-primary" onclick="mostrarModalEditar('${usuario.id}', '${usuario.nombreCompleto}', '${usuario.pin}', '${usuario.avatar}', '${usuario.edad}')">Editar</button>
                    <button class="btn btn-danger" onclick="eliminarUsuario('${usuario.id}')">Eliminar</button>
                </td>
            `;
            listaUsuarios.appendChild(tr);
        });
    }
};

const agregarUsuario = async () => {
    const nombreCompleto = document.getElementById('nombreCompleto')?.value;
    const pin = document.getElementById('pin')?.value;
    const avatar = document.getElementById('avatar')?.value;
    const edad = document.getElementById('edad')?.value;
    const token = localStorage.getItem('token');

    if (!nombreCompleto || !pin || !edad) {
        alert('Por favor, completa todos los campos.');
        return;
    }

    if (!/^\d{6}$/.test(pin)) {
        alert('El PIN debe contener exactamente 6 números.');
        return;
    }

    if (!avatar) {
        alert('Por favor, selecciona una imagen de avatar.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nombreCompleto, pin, avatar, edad })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error del servidor:', errorData);
            alert(`Error al agregar usuario: ${errorData.error || 'Error desconocido'}`);
            return;
        }

        alert('Usuario agregado exitosamente');
        obtenerUsuarios();
        $('#agregarUsuarioModal').modal('hide');
    } catch (error) {
        console.error('Error al agregar usuario:', error);
        alert('Error de conexión: ' + error.message);
    }
};

const mostrarModalEditar = (id, nombreCompleto, pin, avatar, edad) => {
    const editNombreCompleto = document.getElementById('editNombreCompleto');
    const editPin = document.getElementById('editPin');
    const editEdad = document.getElementById('editEdad');
    const editImagenSeleccionada = document.getElementById('editImagenSeleccionada');
    const editAvatar = document.getElementById('editAvatar');
    const formEditarUsuario = document.getElementById('form-editar-usuario');

    if (editNombreCompleto) editNombreCompleto.value = nombreCompleto;
    if (editPin) editPin.value = pin;
    if (editEdad) editEdad.value = edad;
    if (editImagenSeleccionada) editImagenSeleccionada.src = avatar;
    if (editAvatar) editAvatar.value = avatar;
    if (formEditarUsuario) formEditarUsuario.setAttribute('data-id', id);
    
    $('#editarUsuarioModal').modal('show');
};

const guardarCambiosUsuario = async () => {
    const formEditarUsuario = document.getElementById('form-editar-usuario');
    if (!formEditarUsuario) return;

    const id = formEditarUsuario.getAttribute('data-id');
    const nuevoNombreCompleto = document.getElementById('editNombreCompleto')?.value;
    const nuevoPin = document.getElementById('editPin')?.value;
    const nuevoAvatar = document.getElementById('editAvatar')?.value;
    const nuevaEdad = document.getElementById('editEdad')?.value;

    if (!nuevoNombreCompleto || !nuevoPin || !nuevaEdad) {
        alert('Por favor, completa todos los campos.');
        return;
    }

    if (!/^\d{6}$/.test(nuevoPin)) {
        alert('El PIN debe contener exactamente 6 números.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/usuarios/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombreCompleto: nuevoNombreCompleto, pin: nuevoPin, avatar: nuevoAvatar, edad: nuevaEdad })
        });

        if (!response.ok) {
            throw new Error('Error al editar el usuario');
        }

        obtenerUsuarios();
        $('#editarUsuarioModal').modal('hide');
    } catch (error) {
        console.error('Error al guardar cambios:', error);
        alert('Error al guardar cambios: ' + error.message);
    }
};

const eliminarUsuario = async (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
        try {
            const response = await fetch(`http://localhost:3000/usuarios/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Error al eliminar el usuario');
            }

            obtenerUsuarios();
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            alert('Error al eliminar usuario: ' + error.message);
        }
    }
};

function redirectaddUser() {
    window.location.href = '/addUser.html';
}

function redirectaddVideo() {
    window.location.href = '/addVideo.html';
}

function salir() {
    window.location.href = '/inicio.html';
}

function salirC() {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
}