const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    imageURL: String
}, { collection: 'Photo' }); // Asegúrate de que 'Photo' sea exactamente el mismo nombre de tu colección en MongoDB

module.exports = mongoose.model('Photo', ImageSchema);
