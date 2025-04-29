const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    perfilesAsociados: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userRestricted', // Referencia a los perfiles restringidos
        required: true
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Referencia al usuario principal
        required: true
    },
    totalVideos: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Playlist', playlistSchema);