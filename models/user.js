const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Opcional para usuarios de Google
  googleId: { type: String, unique: true, sparse: true }, // Para usuarios de Google
  phoneNumber: { type: String },
  status: { type: String, enum: ['pending', 'active'], default: 'pending' },
  pin: { type: String },
  name: { type: String },
  lastName: { type: String },
  country: { type: String },
  birthDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  tempCode: { type: String },
  tempCodeExpires: { type: Date },
  profileCompleted: { type: Boolean, default: false } // Nuevo campo para verificar si el perfil está completo
});

module.exports = mongoose.model('User', userSchema);