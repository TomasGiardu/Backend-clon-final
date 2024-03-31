const User = require('../models/User');

const UserController = {
  // Método para cambiar el rol de un usuario por su correo electrónico
  async changeUserRoleByEmail(req, res) {
    console.log('Recibida solicitud PUT en /user/change-role');
    const { email } = req.params;
    const { role } = req.body;

    try {
      // Buscar al usuario por su correo electrónico
      const user = await User.findOne({ email });

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

  // Método para obtener el perfil de un usuario por su correo electrónico
  async getUserProfileByEmail(req, res) {
    const { email } = req.params;

    try {
      // Buscar al usuario por su correo electrónico
      const user = await User.findOne({ email });

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

