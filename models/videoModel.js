const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    videoId: {
        type: String,
        required: false
    },
    descripcion: {
        type: String
    },
    thumbnail: {
        type: String,
        required: false
    },
    playlistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('Video', videoSchema);