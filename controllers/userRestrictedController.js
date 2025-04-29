const User = require('../models/userRestricted');
const jwt = require('jsonwebtoken');


exports.obtenerUsuarios = async (req, res) => {
  try {
    const authToken = req.headers['authorization'];
    if (!authToken) {
      return res.status(401).json({ error: 'Token de autorización no proporcionado' });
    }
     
    // Verificar y decodificar el token JWT para obtener el ID del usuario
    const decodedToken = jwt.verify(authToken.split(' ')[1], '12345');
    console.log("Token es ", decodedToken);
 
    const userId = decodedToken.userId;

    const usuarios = await User.find({ userId: userId });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
};

exports.agregarUsuario = async (req, res) => {
  try {
    const authToken = req.headers['authorization'];
    if (!authToken) {
      return res.status(401).json({ error: 'Token de autorización no proporcionado' });
    }

    // Verificar y decodificar el token JWT para obtener el ID del usuario
    const decodedToken = jwt.verify(authToken.split(' ')[1], '12345');
    console.log("Token es ", decodedToken);

    const userId = decodedToken.userId;


    const { nombreCompleto, pin, avatar, edad } = req.body;
    const user = new User({ nombreCompleto, pin, avatar, edad, userId });
    await user.save();
    res.status(201).json({ mensaje: 'Usuario agregado exitosamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.editarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioActualizado = await User.findByIdAndUpdate(id, req.body, { new: true });
    if (!usuarioActualizado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario actualizado exitosamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioEliminado = await User.findByIdAndDelete(id);
    if (!usuarioEliminado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario eliminado exitosamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
