$(document).ready(function () {
    const authToken = localStorage.getItem('token');
    if (!authToken) {
        window.location.href = '/index.html';
        return;
    }

    obtenerPlaylists();
});

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
            console.error('Error en la respuesta:', errorData);
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
        alert('Error al obtener playlists: ' + error.message);
    }
};

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
                    <button class="btn btn-primary" onclick="mostrarVideos('${playlist.id}', '${playlist.nombre}')">Ver Videos</button>
                </td>
            `;
            listaPlaylists.appendChild(tr);
        });
    }
};

const mostrarVideos = async (playlistId, playlistNombre) => {
    try {
        const authToken = localStorage.getItem('token');
        const query = `
            query($playlistId: ID) {
                videos(playlistId: $playlistId) {
                    id
                    nombre
                    url
                    descripcion
                    playlistId
                    userId
                }
            }
        `;

        const response = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                query,
                variables: { playlistId }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error en la respuesta:', errorData);
            throw new Error(errorData.errors?.[0]?.message || 'Error al obtener los videos');
        }

        const data = await response.json();
        console.log('Respuesta de videos:', data); // Depuración
        if (data.errors) {
            throw new Error(data.errors[0].message || 'Error en la consulta GraphQL');
        }

        const videos = data.data.videos;

        document.getElementById('playlistsSection').style.display = 'none';
        document.getElementById('videosSection').style.display = 'block';
        document.getElementById('nombrePlaylistSeleccionada').textContent = playlistNombre;
        document.getElementById('form-agregar-video')?.setAttribute('data-playlist-id', playlistId);
        document.getElementById('form-editar-video')?.setAttribute('data-playlist-id', playlistId);

        const listaVideos = document.getElementById('lista-videos');
        if (listaVideos) {
            listaVideos.innerHTML = '';
            if (videos.length === 0) {
                listaVideos.innerHTML = '<tr><td colspan="4" class="text-center">No hay videos en esta playlist.</td></tr>';
            } else {
                videos.forEach(video => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${video.nombre}</td>
                        <td><a href="${video.url}" target="_blank">${video.url}</a></td>
                        <td>${video.descripcion || 'Sin descripción'}</td>
                        <td>
                            <button class="btn btn-primary" onclick="mostrarModalEditarVideo('${video.id}', '${video.nombre}', '${video.url}', '${video.descripcion || ''}')">Editar</button>
                            <button class="btn btn-danger" onclick="eliminarVideo('${video.id}', '${playlistId}')">Eliminar</button>
                        </td>
                    `;
                    listaVideos.appendChild(tr);
                });
            }
        }
    } catch (error) {
        console.error('Error al obtener videos:', error);
        alert('Hubo un error al cargar los videos: ' + error.message);
    }
};

const volverAPlaylists = () => {
    document.getElementById('videosSection').style.display = 'none';
    document.getElementById('playlistsSection').style.display = 'block';
    obtenerPlaylists();
};

const validarYouTubeUrl = (url) => {
    const regex = /^(https?:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$/;
    return regex.test(url);
};

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