const express = require('express');
const app = express();
const port = 8080;
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const handlebars = require('express-handlebars');
const http = require('http');
const socketIO = require('socket.io');
const server = http.createServer(app);
const productManagerInstance = require('./productManager');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });
const connectToDatabase = require('./config/database');
const router = express.Router();
const productRouter = require('./Routers/router');
const carritoRouter = require('./Routers/carritoRouter');
const { MongoTopologyClosedError } = require('mongodb');
const path = require('path');
const session = require('express-session');
const authRouter = require('./Routers/authRouter');
const User = require('./models/User');
const passport = require('passport');
const initializePassport = require('./passport.config');
const config = require('./config/config')
const currentRoute = require('./routes/current');
const obtenerProductosDelCarrito = require('./carrito');
const carritoRouters = require('./Routers/carritoRouter');
const Carrito = require('./carrito')
const { ObjectId } = require('mongoose').Types;
const mockingModule = require('./mokingModule/mockingModule');
const logger = require('./utils/logger');
const ProductManager = require('./productManager');
const userRoutes = require('./routes/userRoutes');
const UserController = require('./controllers/UserController');

//Mongo
const URL = process.env.MONGODB_URI;
//Swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
//Stripe
const stripe = require('stripe')("sk_test_51OxHuAP8j3fUQoA7VpyyPd7vdd9I0HhzHcrQWmiPkeUtJCnPdQPOOgEr8tAz1DOyLX8gKISFU3zcIIPosUjFjQgy00E9TnAZTN");

const carrito = new Carrito();


require('dotenv').config();

//Configurar login
// Configuración de sesiones con almacenamiento en archivos
app.use(session({
  secret: 'mysecretkey', // Clave secreta para firmar la sesión
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }, // Configuración de la cookie de sesión
}));


// Configurar Handlebars como motor de vistas
app.engine('handlebars', handlebars.engine({
  layoutsDir: path.join(__dirname, 'views/layouts'), // Directorio de layouts
  defaultLayout: 'main', // Establecer 'main' como diseño por defecto
  extname: 'handlebars' // Establecer la extensión de los archivos de vistas
}));
app.set('view engine', 'handlebars');

// Establecer la ubicación de las vistas
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    // Si el usuario está autenticado, redirige a la página principal
    res.redirect('/home');
  } else {
    // Si no está autenticado, redirige al formulario de inicio de sesión
    res.redirect('/login');
  }
});

// Rutas
app.get('/home', (req, res) => {
  if (!req.session.user) {
    // Si el usuario no está autenticado, redirige al inicio de sesión
    res.redirect('/login');
  } else {
    // Si está autenticado, muestra la página principal
    res.render('home'); // Renderiza la vista 'home.handlebars'
  }
});

app.get('/login', (req, res) => {
  res.render('login'); // Renderiza la vista de inicio de sesión
});

app.put('/users/premium', async (req, res) => {
  console.log('Solicitud PUT recibida en /users/premium');
  try {
      // Verificar si el usuario está autenticado
      if (!req.session.user) {
          console.log('Usuario no autenticado');
          return res.status(401).send('Debes iniciar sesión para realizar esta acción');
      }

      // Buscar al usuario actual en la base de datos
      const user = await User.findById(req.session.user._id);

      if (!user) {
          console.log('Usuario no encontrado en la base de datos');
          return res.status(404).send('Usuario no encontrado');
      }

      // Actualizar el rol del usuario a "premium"
      user.role = 'premium';
      await user.save();

      // Actualizar la sesión del usuario con el nuevo rol
      req.session.user.role = 'premium';

      console.log('Rol del usuario actualizado a premium');
      res.status(200).send('Tu rol ha sido actualizado a premium');
  } catch (error) {
      console.error('Error al actualizar el rol del usuario:', error);
      res.status(500).send('Error al actualizar el rol del usuario');
  }
});

app.use(express.urlencoded({ extended: true }));
app.use('/user', userRoutes);
app.use('/api', userRoutes);
app.use('/api/carrito', carritoRouters);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/api', router);
app.use('/api/products', productRouter);
app.use('/api/carts', carritoRouter);
app.use('/', authRouter);
app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRouter);
app.use('/api', currentRoute);
connectToDatabase();

const clients = new Set();

// Maneja conexiones WebSocket
wss.on('connection', (ws) => {
  clients.add(ws);
  if (clients.size === 1) {
    console.log('Cliente WebSocket conectado');
  }

  // Maneja el cierre de la conexión WebSocket
  ws.on('close', () => {
    clients.delete(ws);
    if (clients.size === 0) {
      console.log('Cliente WebSocket desconectado');
    }
  });
});

// Define la ruta POST para subir un nuevo producto
app.post('/subir-producto', (req, res) => {
  console.log('Ruta /subir-producto alcanzada'); // Verificar si la ruta es alcanzada correctamente

  const { productName, productDescription, productPrice, productQuantity } = req.body;
  console.log('Datos del producto recibidos:', req.body); // Verificar los datos del producto recibidos

  // Agrega el producto al ProductManager
  ProductManager.agregarProducto(productName, productDescription, productPrice, productQuantity);

  console.log('Producto agregado al ProductManager'); // Confirmar que el producto se ha agregado correctamente

  // Redirige a la página principal o muestra un mensaje de éxito
  res.redirect('/');
});

//Define la ruta resetPassword para restablecer la contraseña
app.get('/reset-password', (req, res) => {
  res.render('reset-password'); // Renderizar la vista reset-password.hbs
});

// Define la ruta GET '/carrito' para renderizar vista 'carrito.handlebars'
app.get('/carrito', async (req, res) => {
  const cartId = '1'; // Sustituye esto con el ID real de tu carrito
  try {
    const productosCarrito = await carrito.obtenerCarritoPorId(cartId);
    res.render('carrito', { productosCarrito, cartId });
  } catch (error) {
    console.error("Error al obtener productos del carrito:", error);
    res.status(500).send("Error al obtener productos del carrito");
  }
});

// Define la ruta GET para '/perfil'
app.get('/perfil', async (req, res) => {
  try {
    // Verificar si el usuario está autenticado y tiene una sesión válida
    if (!req.session.user) {
      return res.status(401).json({ message: 'Debes iniciar sesión para acceder a tu perfil' });
    }

    // Obtener el correo electrónico del usuario desde la sesión
    const userEmail = req.session.user.email;

    // Verificar si el correo electrónico está definido
    if (!userEmail) {
      return res.status(400).json({ message: 'Correo electrónico del usuario no encontrado en la sesión' });
    }

    // Obtener los datos del usuario desde la base de datos utilizando el correo electrónico
    const userData = await User.findOne({ email: userEmail });

    // Renderizar la vista 'perfil' y pasar los datos del usuario obtenidos de la base de datos
    res.render('perfil', { user: { name: userData.name, email: userData.email, role: userData.role } });
  } catch (error) {
    console.error('Error al obtener los datos del usuario:', error);
    res.status(500).json({ message: 'Se produjo un error al obtener los datos del usuario' });
  }
});

//Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API Proyecto Final',
      version: '1.0.0',
      description: 'Documentación de la API de Mi Proyecto Final utilizando Swagger',
    },
    servers: [
      {
        url: 'http://localhost:8080', 
        description: 'Servidor local',
      },
    ],
  },
  apis: ['./productManager.js', './Routers/carritoRouter.js'], // Rutas a los archivos productos y carrito
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use(express.static('public'));
app.use(bodyParser.json());

const io = socketIO(server);
io.on('connection', (socket) => {
  console.log('Cliente conectado');
  io.emit('productosActualizados', productManagerInstance.ObtenerProductos());
});


app.get('/realtimeproducts', (req, res) => {
  const productos = productManagerInstance.ObtenerProductos();
  res.render('realTimeProducts', { productos });
});

//Modulo Mocking
app.use('/', mockingModule);

// Ruta para procesar el pago
app.post('/procesar-pago', async (req, res) => {
  try {
      const { token, cartId } = req.body; // Token de pago y ID del carrito enviados desde el cliente

      // Obtener productos del carrito usando la instancia de Carrito
      const productos = carrito.obtenerCarritoPorId(cartId);

      console.log("Productos en el carrito:", productos);
      // Calcular el monto total del carrito
      let total = 1;
      productos.forEach(producto => {
      total += producto.price.Precio * producto.quantity; // Acceder al precio dentro de un objeto 'price'
});
console.log("Monto total:", total * 100);
      console.log("Monto total:", total * 100);

      // Procesar el pago utilizando la biblioteca de Stripe
      const charge = await stripe.charges.create({
          amount: total * 100, // Convertir el monto a centavos
          currency: 'usd',
          source: token,
          description: 'Pago de productos en mi tienda',
      });
      // Devolver una respuesta exitosa al cliente
      res.status(200).json({ success: true, message: 'Pago procesado exitosamente' });
  } catch (error) {
      console.error('Error al procesar el pago:', error);
      res.status(500).json({ success: false, error: 'Error al procesar el pago en el servidor' });
  }
});

//Github
app.use(express.urlencoded({ extended: false }));

initializePassport(passport);

app.use(passport.initialize());
app.use(passport.session());

//Logger end point
app.get('/loggerTest', (req, res) => {
  logger.debug('Esto es un mensaje de debug');
  logger.http('Esto es un mensaje HTTP');
  logger.info('Esto es un mensaje de info');
  logger.warning('Esto es un mensaje de advertencia');
  logger.error('Esto es un mensaje de error');
  logger.fatal('Esto es un mensaje fatal');

  res.send('Logs generados. Verifica la consola y el archivo errors.log.');
});

//Servidor
server.listen(port, () => {
  console.log('Servidor en ejecución en el puerto 8080');
});

app.set('io', io);

mongoose.connect(URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Base de datos conectada');
  })
  .catch((error) => {
    console.error('Error en la conexión de la base de datos:', error);
  });

module.exports = app;