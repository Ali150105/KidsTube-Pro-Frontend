$(document).ready(function () {
    // Verifica token
    const authToken = localStorage.getItem('token');
    if (!authToken) {
        window.location.href = '/index.html';
        return;
    }

    // Verificar y agregar event listeners solo si los elementos existen
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

    obtenerUsuarios(); // Cargar usuarios
});

// Función para previsualizar la imagen seleccionada
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

// Función para obtener y mostrar los usuarios
const obtenerUsuarios = async () => {
    try {
        const authToken = localStorage.getItem('token');
        if (!authToken) {
            throw new Error('Token de autorización no proporcionado');
        }

        const response = await fetch('http://localhost:3000/usuarios', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const usuarios = await response.json();
        mostrarUsuarios(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
    }
};

// Función para mostrar los usuarios en la tabla
const mostrarUsuarios = (usuarios) => {
    const listaUsuarios = document.getElementById('lista-usuarios');
    if (listaUsuarios) {
        listaUsuarios.innerHTML = '';
        usuarios.forEach(usuario => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${usuario.nombreCompleto}</td>
                <td>${usuario.pin}</td>
                <td><img src="${usuario.avatar}" style="width:50px;height:50px;"></td>
                <td>${usuario.edad}</td>
                <td>
                    <button class="btn btn-primary" onclick="mostrarModalEditar('${usuario._id}', '${usuario.nombreCompleto}', '${usuario.pin}', '${usuario.avatar}', '${usuario.edad}')">Editar</button>
                    <button class="btn btn-danger" onclick="eliminarUsuario('${usuario._id}')">Eliminar</button>
                </td>
            `;
            listaUsuarios.appendChild(tr);
        });
    }
};

// Función para agregar un usuario
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
            console.log(errorData);
            alert('Hubo un error al procesar la solicitud: ' + errorData.message);
        } else {
            alert('Usuario agregado exitosamente');
            obtenerUsuarios();
            $('#agregarUsuarioModal').modal('hide');
        }
    } catch (error) {
        console.error('Error al agregar usuario:', error);
        alert('Hubo un error al procesar la solicitud: ' + error.message);
    }
};

// Función para mostrar el modal de edición
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

// Función para guardar los cambios del usuario editado
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
    }
};

// Función para eliminar un usuario
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