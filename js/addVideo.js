$(document).ready(function () {
    // Verifica token
    const authToken = localStorage.getItem('token');
    if (!authToken) {
        window.location.href = '/index.html';
        return;
    }

    obtenerPlaylists(); // Cargar playlists al inicio
});

// Función para obtener y mostrar las playlists
const obtenerPlaylists = async () => {
    try {
        const authToken = localStorage.getItem('token');
        if (!authToken) {
            throw new Error('Token de autorización no proporcionado');
        }

        const response = await fetch('http://localhost:3000/playlists', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener las playlists');
        }

        const playlists = await response.json();
        mostrarPlaylists(playlists);
    } catch (error) {
        console.error('Error al obtener playlists:', error);
    }
};

// Función para mostrar las playlists en la tabla
const mostrarPlaylists = (playlists) => {
    const listaPlaylists = document.getElementById('lista-playlists');
    if (listaPlaylists) {
        listaPlaylists.innerHTML = '';
        playlists.forEach(playlist => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${playlist.nombre}</td>
                <td>${playlist.totalVideos || 0}</td>
                <td>
                    <button class="btn btn-primary" onclick="mostrarVideos('${playlist._id}', '${playlist.nombre}')">Ver Videos</button>
                </td>
            `;
            listaPlaylists.appendChild(tr);
        });
    }
};

// Función para mostrar los videos de una playlist seleccionada
const mostrarVideos = async (playlistId, playlistNombre) => {
    try {
        const authToken = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/videos/playlist/${playlistId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener los videos');
        }

        const videos = await response.json();
        document.getElementById('playlistsSection').style.display = 'none';
        document.getElementById('videosSection').style.display = 'block';
        document.getElementById('nombrePlaylistSeleccionada').textContent = playlistNombre;
        document.getElementById('form-agregar-video')?.setAttribute('data-playlist-id', playlistId);
        document.getElementById('form-editar-video')?.setAttribute('data-playlist-id', playlistId);

        const listaVideos = document.getElementById('lista-videos');
        if (listaVideos) {
            listaVideos.innerHTML = '';
            videos.forEach(video => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${video.nombre}</td>
                    <td><a href="${video.url}" target="_blank">${video.url}</a></td>
                    <td>${video.descripcion || 'Sin descripción'}</td>
                    <td>
                        <button class="btn btn-primary" onclick="mostrarModalEditarVideo('${video._id}', '${video.nombre}', '${video.url}', '${video.descripcion || ''}')">Editar</button>
                        <button class="btn btn-danger" onclick="eliminarVideo('${video._id}', '${playlistId}')">Eliminar</button>
                    </td>
                `;
                listaVideos.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Error al obtener videos:', error);
        alert('Hubo un error al cargar los videos: ' + error.message);
    }
};

// Función para volver a la lista de playlists
const volverAPlaylists = () => {
    document.getElementById('videosSection').style.display = 'none';
    document.getElementById('playlistsSection').style.display = 'block';
    obtenerPlaylists();
};

// Función para validar una URL de YouTube
const validarYouTubeUrl = (url) => {
    const regex = /^(https?:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$/;
    return regex.test(url);
};

// Función para agregar un video
const agregarVideo = async () => {
    const form = document.getElementById('form-agregar-video');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const nombre = document.getElementById('nombreVideo')?.value;
    const url = document.getElementById('urlVideo')?.value;
    const descripcion = document.getElementById('descripcionVideo')?.value;
    const playlistId = form.getAttribute('data-playlist-id');
    const token = localStorage.getItem('token');

    // Validación adicional de la URL
    if (!validarYouTubeUrl(url)) {
        alert('Por favor, ingresa una URL válida de YouTube.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/videos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nombre, url, descripcion, playlistId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al agregar el video');
        }

        alert('Video agregado exitosamente');
        mostrarVideos(playlistId, document.getElementById('nombrePlaylistSeleccionada').textContent);
        $('#agregarVideoModal').modal('hide');
        document.getElementById('form-agregar-video')?.reset();
        document.getElementById('agregarNuevoVideoBtn')?.focus();
    } catch (error) {
        console.error('Error al agregar video:', error);
        alert('Hubo un error al procesar la solicitud: ' + error.message);
    }
};

// Función para mostrar el modal de edición
const mostrarModalEditarVideo = (id, nombre, url, descripcion) => {
    const editNombreVideo = document.getElementById('editNombreVideo');
    const editUrlVideo = document.getElementById('editUrlVideo');
    const editDescripcionVideo = document.getElementById('editDescripcionVideo');
    const formEditarVideo = document.getElementById('form-editar-video');

    if (editNombreVideo) editNombreVideo.value = nombre;
    if (editUrlVideo) editUrlVideo.value = url;
    if (editDescripcionVideo) editDescripcionVideo.value = descripcion || '';
    if (formEditarVideo) formEditarVideo.setAttribute('data-video-id', id);

    $('#editarVideoModal').modal('show');
};

// Función para guardar los cambios de un video editado
const guardarCambiosVideo = async () => {
    const form = document.getElementById('form-editar-video');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const id = form.getAttribute('data-video-id');
    const playlistId = form.getAttribute('data-playlist-id');
    const nuevoNombre = document.getElementById('editNombreVideo')?.value;
    const nuevaUrl = document.getElementById('editUrlVideo')?.value;
    const nuevaDescripcion = document.getElementById('editDescripcionVideo')?.value;
    const token = localStorage.getItem('token');

    // Validación adicional de la URL
    if (!validarYouTubeUrl(nuevaUrl)) {
        alert('Por favor, ingresa una URL válida de YouTube.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/videos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nombre: nuevoNombre, url: nuevaUrl, descripcion: nuevaDescripcion })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al editar el video');
        }

        alert('Video actualizado exitosamente');
        mostrarVideos(playlistId, document.getElementById('nombrePlaylistSeleccionada').textContent);
        $('#editarVideoModal').modal('hide');
        document.getElementById('agregarNuevoVideoBtn')?.focus();
    } catch (error) {
        console.error('Error al guardar cambios:', error);
        alert('Hubo un error al procesar la solicitud: ' + error.message);
    }
};

// Función para eliminar un video
const eliminarVideo = async (id, playlistId) => {
    if (confirm('¿Estás seguro de que quieres eliminar este video?')) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/videos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al eliminar el video');
            }

            alert('Video eliminado exitosamente');
            mostrarVideos(playlistId, document.getElementById('nombrePlaylistSeleccionada').textContent);
            document.getElementById('agregarNuevoVideoBtn')?.focus();
        } catch (error) {
            console.error('Error al eliminar video:', error);
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