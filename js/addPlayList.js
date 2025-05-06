$(document).ready(function () {
    // Verifica token
    const authToken = localStorage.getItem('token');
    if (!authToken) {
        window.location.href = '/index.html';
        return;
    }

    obtenerPlaylists(); // Cargar playlists al inicio
    obtenerPerfiles();  // Cargar perfiles para los selects
});


// Función para obtener y mostrar las playlists
const obtenerPerfiles = async () => {
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
            throw new Error(errorData.errors?.[0]?.message || 'Error al obtener los perfiles');
        }

        const data = await response.json();
        console.log('Respuesta de perfiles:', data); // Depuración
        if (data.errors) {
            throw new Error(data.errors[0].message || 'Error en la consulta GraphQL');
        }

        const perfiles = data.data.profiles;
        const selectAgregar = document.getElementById('perfilesAsociados');
        const selectEditar = document.getElementById('editPerfilesAsociados');
        perfiles.forEach(perfil => {
            const option = document.createElement('option');
            option.value = perfil.id;
            option.textContent = perfil.nombreCompleto;
            if (selectAgregar) selectAgregar.appendChild(option.cloneNode(true));
            if (selectEditar) selectEditar.appendChild(option.cloneNode(true));
        });
    } catch (error) {
        console.error('Error al obtener perfiles:', error);
        alert('Hubo un error al cargar los perfiles: ' + error.message);
    }
};


// Función para obtener y mostrar las playlists
const obtenerPlaylists = async () => {
    try {
        const authToken = localStorage.getItem('token');
        if (!authToken) {
            throw new Error('Token de autorización no proporcionado');
        }

        const query = `
            query {
                playlists {
                    id
                    nombre
                    totalVideos
                    perfilesAsociados {
                        id
                        nombreCompleto
                    }
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
            throw new Error(errorData.errors?.[0]?.message || 'Error al obtener las playlists');
        }

        const data = await response.json();
        console.log('Respuesta de playlists:', data); // Depuración
        if (data.errors) {
            throw new Error(data.errors[0].message || 'Error en la consulta GraphQL');
        }

        const playlists = data.data.playlists;
        mostrarPlaylists(playlists);
    } catch (error) {
        console.error('Error al obtener playlists:', error);
        alert('Hubo un error al cargar las playlists: ' + error.message);
    }
};

// Función para mostrar las playlists en la tabla
const mostrarPlaylists = (playlists) => {
    const listaPlaylists = document.getElementById('lista-playlists');
    if (listaPlaylists) {
        listaPlaylists.innerHTML = '';
        playlists.forEach(playlist => {
            // Asegurarse de que perfilesAsociados sea un array válido antes de procesarlo
            const perfilesIds = playlist.perfilesAsociados && Array.isArray(playlist.perfilesAsociados)
                ? JSON.stringify(playlist.perfilesAsociados.map(p => p.id))
                : '[]'; // Si no hay perfiles, usar un array vacío como string
            const perfilesNombres = playlist.perfilesAsociados && Array.isArray(playlist.perfilesAsociados)
                ? playlist.perfilesAsociados.map(p => p.nombreCompleto).join(', ')
                : 'Sin perfiles';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${playlist.nombre}</td>
                <td>${playlist.totalVideos || 0}</td>
                <td>${perfilesNombres}</td>
                <td>
                    <button class="btn btn-primary" onclick="mostrarModalEditarPlaylist('${playlist.id}', '${playlist.nombre}', '${encodeURIComponent(perfilesIds)}')">Editar</button>
                    <button class="btn btn-danger" onclick="eliminarPlaylist('${playlist.id}')">Eliminar</button>
                </td>
            `;
            listaPlaylists.appendChild(tr);
        });
    }
};

// Función para agregar una playlist
const agregarPlaylist = async () => {
    const nombre = document.getElementById('nombrePlaylist')?.value;
    const perfilesAsociados = Array.from(document.getElementById('perfilesAsociados')?.selectedOptions || []).map(option => option.value);
    const token = localStorage.getItem('token');

    if (!nombre || !nombre.trim()) {
        alert('El nombre del playlist es requerido.');
        return;
    }
    if (perfilesAsociados.length === 0) {
        alert('Debes seleccionar al menos un perfil asociado.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/playlists', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nombre, perfilesAsociados })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al agregar la playlist');
        }

        alert('Playlist agregada exitosamente');
        obtenerPlaylists();
        $('#agregarPlaylistModal').modal('hide');
        // Mover el foco al botón "Agregar Nueva"
        document.getElementById('agregarNuevaBtn')?.focus();
    } catch (error) {
        console.error('Error al agregar playlist:', error);
        alert('Hubo un error al procesar la solicitud: ' + error.message);
    }
};

// Función para mostrar el modal de edición
const mostrarModalEditarPlaylist = (id, nombre, perfilesAsociados) => {
    const editNombrePlaylist = document.getElementById('editNombrePlaylist');
    const editPerfilesAsociados = document.getElementById('editPerfilesAsociados');
    const formEditarPlaylist = document.getElementById('form-editar-playlist');

    if (editNombrePlaylist) editNombrePlaylist.value = nombre;
    if (editPerfilesAsociados) {
        const perfilesArray = JSON.parse(decodeURIComponent(perfilesAsociados)); // Decodificar y parsear
        Array.from(editPerfilesAsociados.options).forEach(option => {
            option.selected = perfilesArray.includes(option.value);
        });
    }
    if (formEditarPlaylist) formEditarPlaylist.setAttribute('data-id', id);

    $('#editarPlaylistModal').modal('show');
};

// Función para guardar los cambios de la playlist editada
const guardarCambiosPlaylist = async () => {
    const formEditarPlaylist = document.getElementById('form-editar-playlist');
    if (!formEditarPlaylist) return;

    const id = formEditarPlaylist.getAttribute('data-id');
    const nuevoNombre = document.getElementById('editNombrePlaylist')?.value;
    const nuevosPerfilesAsociados = Array.from(document.getElementById('editPerfilesAsociados')?.selectedOptions || []).map(option => option.value);
    const token = localStorage.getItem('token');

    if (!nuevoNombre || !nuevoNombre.trim()) {
        alert('El nombre del playlist es requerido.');
        return;
    }
    if (nuevosPerfilesAsociados.length === 0) {
        alert('Debes seleccionar al menos un perfil asociado.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/playlists/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nombre: nuevoNombre, perfilesAsociados: nuevosPerfilesAsociados })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al editar la playlist');
        }

        alert('Playlist actualizada exitosamente');
        obtenerPlaylists();
        $('#editarPlaylistModal').modal('hide');
        // Mover el foco al botón "Agregar Nueva"
        document.getElementById('agregarNuevaBtn')?.focus();
    } catch (error) {
        console.error('Error al guardar cambios:', error);
        alert('Hubo un error al procesar la solicitud: ' + error.message);
    }
};

// Función para eliminar una playlist
const eliminarPlaylist = async (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta playlist?')) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/playlists/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al eliminar la playlist');
            }

            alert('Playlist eliminada exitosamente');
            obtenerPlaylists();
            // Mover el foco al botón "Agregar Nueva"
            document.getElementById('agregarNuevaBtn')?.focus();
        } catch (error) {
            console.error('Error al eliminar playlist:', error);
            alert('Hubo un error al procesar la solicitud: ' + error.message);
        }
    }
};

// Funciones de redirección
function redirectaddUser() {
    window.location.href = '/addUser.html';
}

function redirectaddPlaylist() {
    window.location.href = '/addPlaylist.html';
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