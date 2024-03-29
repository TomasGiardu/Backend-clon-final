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
const carts = require('./models/carts');
const message = require('./models/message');
const product = require('./models/product');
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
const userRoutes = require('./routes/userRoutes'); // Importa las rutas de usuario
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

// Define una ruta GET para '/perfil' que sirva el archivo handlebars correspondiente
app.get('/perfil', (req, res) => {
  res.render('perfil'); 
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