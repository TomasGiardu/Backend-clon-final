const express = require('express');
const router = express.Router();
const User = require('../models/User');
const saltRounds = 10;
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Carrito = require('../carrito');
//Recuperacion de contraseña
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const sendResetPasswordEmail = require('../config/transporter');
const multer = require('multer');
const app = require('../app');




router.get('/register', (req, res) => {
    if (req.session.user) {
        res.redirect('/home');
    } else {
        res.render('register');
    }
  });

// Configuración de almacenamiento para diferentes tipos de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      let destinationFolder = 'documents'; // Carpeta predeterminada para documentos
  
      // Determina la carpeta de destino según el tipo de archivo
      if (file.fieldname === 'profileImage') {
        destinationFolder = 'profiles';
      } else if (file.fieldname === 'productImage') {
        destinationFolder = 'products';
      }
  
      cb(null, destinationFolder + '/');
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
});

//Configurar multer para el almacenamiento
const upload = multer({ storage: storage });

// Middleware de Multer para manejar la carga de archivos
const uploadFiles = upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'productImage', maxCount: 1 },
    { name: 'documentFile', maxCount: 10 }
]);

//Ruta para cargar archivos
router.post('/:uid/documents', uploadFiles, async (req, res) => {
    // Verificar si el usuario ha terminado de cargar los documentos requeridos
    const { identification, proofOfAddress, bankStatement } = req.files;
    if (!identification || !proofOfAddress || !bankStatement) {
      return res.status(400).json({ error: 'Falta uno o más documentos requeridos.' });
    }
  
    //Falta actualizar la base de datos
  
    res.status(200).json({ message: 'Archivos subidos exitosamente.' });
  });

// Ruta para mostrar el formulario de inicio de sesión
router.get('/login', (req, res) => {
    if (req.session.user) {
        res.redirect('/home');
    } else {
        res.render('login', { layout: 'loginLayout', showButtons: false });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Busca al usuario por su correo electrónico en la base de datos
        const user = await User.findOne({ email });

        if (!user || user.password !== password) {
            // Si el usuario no existe o la contraseña es incorrecta, muestra un mensaje de error
            console.error('Credenciales incorrectas');
            return res.redirect('/login');
        }

        // Si las credenciales son correctas, establece la sesión del usuario
        req.session.user = {
            email: user.email,
            role: user.role // Si tienes un campo de 'role' en tu modelo de usuario
        };

        res.redirect('/home'); // Redirige a la página principal
    } catch (error) {
        console.error('Error al intentar iniciar sesión:', error);
        res.status(500).send('Error al iniciar sesión');
    }
});


// Ruta para el cierre de sesión
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/login');
        }
    });
});

  
// Ruta para procesar el registro de un nuevo usuario
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Verifica si el correo electrónico ya está en uso
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).send('El correo electrónico ya está en uso');
        }

        // Crea un nuevo usuario con los datos proporcionados
        const newUser = new User({ name, email, password });
        await newUser.save(); // Guarda el nuevo usuario en la base de datos

        res.redirect('/login');
    } catch (error) {
        console.error('Error al registrar al usuario:', error);
        res.status(500).send('Error al registrar al usuario');
    }
});
  
const hashFromDatabase = '$2b$10$YourStoredHashHere';
const passwordAttempt = 'password123';

bcrypt.compare(passwordAttempt, hashFromDatabase, function(err, result) {
  if (err) {
    // Manejar el error
    console.error(err);
    return;
  }

  if (result) {
    // Contraseña correcta
    console.log('Contraseña correcta');
  } else {
    // Contraseña incorrecta
    console.log('Contraseña incorrecta');
  }
});

// Ruta para que un usuario actualice su propio rol a premium
router.put('/users/premium', async (req, res) => {
    try {
        // Verificar si el usuario está autenticado
        if (!req.session.user) {
            return res.status(401).send('Debes iniciar sesión para realizar esta acción');
        }

        // Buscar al usuario actual en la base de datos
        const user = await User.findById(req.session.user._id);

        if (!user) {
            return res.status(404).send('Usuario no encontrado');
        }

        // Verificar si el usuario ha cargado los documentos requeridos
        if (!user.documents || !user.documents.identification || !user.documents.proofOfAddress || !user.documents.bankStatement) {
            return res.status(400).send('Debes cargar todos los documentos requeridos para actualizar tu rol a premium');
        }

        // Actualizar el rol del usuario a "premium"
        user.role = 'premium';
        await user.save();

        // Actualizar la sesión del usuario con el nuevo rol
        req.session.user.role = 'premium';

        res.status(200).send('Tu rol ha sido actualizado a premium');
    } catch (error) {
        console.error('Error al actualizar el rol del usuario:', error);
        res.status(500).send('Error al actualizar el rol del usuario');
    }
});


// Ruta para subir archivos a un usuario específico por su ID
router.post('/:userId/documents', upload.array('documents'), async (req, res) => {
    const userId = req.params.userId;
    const uploadedFiles = req.files;

    try {
        // Buscar al usuario por su ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('Usuario no encontrado');
        }

        // Actualizar el status del usuario para indicar que se han subido documentos
        user.documents = uploadedFiles.map(file => ({
            name: file.originalname,
            reference: file.path // O cualquier URL o referencia a los archivos subidos
        }));

        await user.save();

        res.status(200).send('Archivos subidos correctamente');
    } catch (error) {
        console.error('Error al subir archivos:', error);
        res.status(500).send('Error al subir archivos');
    }
});

// Configurar la estrategia de autenticación local
passport.use(new LocalStrategy({
    usernameField: 'email', // Suponiendo que estás utilizando el correo electrónico como nombre de usuario
    passwordField: 'password', // Campo de contraseña en el formulario de inicio de sesión
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ email });

        // Verificar si el usuario existe y si la contraseña es válida
        if (!user || !await user.isValidPassword(password)) {
            return done(null, false, { message: 'Correo electrónico o contraseña incorrectos' });
        }

        // Si el usuario y la contraseña son válidos, devolver el usuario
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// Configuración de Passport.js
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

//GitHub

router.get(
    "/github",
    passport.authenticate("github", { scope: ["user:email"] }) 
  );

  router.get(
    "/github/callback",
    passport.authenticate("github", { failureRedirect: "/login" }),
    async (req, res) => {
        req.session.user = req.user;
        res.redirect("/home");
    }
);

// Ruta para solicitar un restablecimiento de contraseña
router.post('/forgot-password', async (req, res) => {
    debugger
    try {
        const { email } = req.body;
        console.log('Solicitando restablecimiento de contraseña para:', email);

        const user = await User.findOne({ email });

        if (!user) {
            console.log('El correo electrónico proporcionado no está registrado');
            return res.status(404).json({ message: 'El correo electrónico proporcionado no está registrado' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        const expiresIn = Date.now() + 3600000;
        user.resetPasswordToken = token;
        user.resetPasswordExpires = expiresIn;
        await user.save();

        console.log('Token generado:', token);

        await sendResetPasswordEmail(user, token);

        console.log('Correo electrónico de restablecimiento enviado');

        res.status(200).json({ message: 'Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña' });
    } catch (error) {
        console.error('Error al solicitar el restablecimiento de contraseña:', error);
        res.status(500).json({ message: 'Se produjo un error al procesar la solicitud' });
    }
});

  // Ruta para restablecer la contraseña
  router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
  
        // Buscar al usuario por el token de restablecimiento de contraseña
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
  
        if (!user) {
            return res.status(400).json({ message: 'El enlace de restablecimiento de contraseña es inválido o ha expirado' });
        }
  
        // Verificar si la nueva contraseña es igual a la anterior
        const passwordMatch = await bcrypt.compare(newPassword, user.password);
        if (passwordMatch) {
            return res.status(400).json({ message: 'La nueva contraseña no puede ser la misma que la contraseña anterior' });
        }
  
        // Actualizar la contraseña del usuario
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
  
        res.status(200).json({ message: 'La contraseña se ha restablecido con éxito' });
    } catch (error) {
        console.error('Error al restablecer la contraseña:', error);
        res.status(500).json({ message: 'Se produjo un error al procesar la solicitud' });
    }
  });

module.exports = router;

/*
// Ruta para solicitar un restablecimiento de contraseña
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Buscar al usuario por su dirección de correo electrónico
        const user = await User.findOne({ email });

        if (!user) {
            console.log('El correo electrónico proporcionado no está registrado');
            return res.status(404).json({ message: 'El correo electrónico proporcionado no está registrado' });
        }

        // Generar token de restablecimiento de contraseña
        const token = crypto.randomBytes(20).toString('hex');
        const expiresIn = Date.now() + 3600000; // Expira en 1 hora
        user.resetPasswordToken = token;
        user.resetPasswordExpires = expiresIn;
        await user.save();

        console.log('Correo electrónico encontrado en la base de datos:', user.email);

        // Aquí puedes agregar el código para enviar el correo electrónico

        res.status(200).json({ message: 'Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña' });
    } catch (error) {
        console.error('Error al solicitar el restablecimiento de contraseña:', error);
        res.status(500).json({ message: 'Se produjo un error al procesar la solicitud' });
    }
});
*/