const Image = require('../models/photo');

exports.getImages = async (req, res) => {
  try {
      const images = await Image.find();
      console.log(images); // Verificar los datos obtenidos
      res.json(images);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
};
