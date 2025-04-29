const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombreCompleto: {
    type: String,
    required: true
  },
  pin: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    required: true
  },
  edad: {
    type: Number,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Tipo de datos para almacenar el ID de un documento en otra colección
    ref: 'User', // Nombre del modelo de usuario al que está asociado el ID
    required: true
  }
});

module.exports = mongoose.model('userRestricted', userSchema);
