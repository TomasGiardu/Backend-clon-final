const User = require('../models/User');

const UserController = {
  // Método para cambiar el rol de un usuario
  async changeUserRole(req, res) {
    const { uid } = req.params;
    const { role } = req.body;

    try {
      // Buscar al usuario por su ID
      const user = await User.findById(uid);
      
      console.log('Datos del usuario:', user);

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Actualizar el rol del usuario
      user.role = role;
      await user.save();

      res.status(200).json({ message: 'Rol de usuario actualizado correctamente' });
    } catch (error) {
      console.error('Error al cambiar el rol del usuario:', error);
      res.status(500).json({ message: 'Se produjo un error al procesar la solicitud' });
    }
  },

  // Método para obtener el perfil de un usuario
  async getUserProfile(req, res) {
    const { userId } = req.params;

    try {
      // Buscar al usuario por su ID
      const user = await User.findById(userId);

      console.log('Perfil de usuario:', user); // Agregado para depuración

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Devolver los datos del usuario
      res.status(200).json(user);
    } catch (error) {
      console.error('Error al obtener el perfil del usuario:', error);
      res.status(500).json({ message: 'Se produjo un error al procesar la solicitud' });
    }
  }
};

module.exports = UserController;
