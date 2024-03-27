const express = require('express');
const router = express.Router();
const productManagerInstance  = require('../productManager');
const Carts = require('../models/carts');
const Product = require('../models/product');
const Carrito = require('../carrito');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const authorizationMiddleware = require('../middleware/authorization');
const Ticket = require('../Tickets/ticketModel');
//Manejo de errores
const CustomError = require('../services/Errors/CustomError');
const { ERROR_ADD_TO_CART } = require('../services/Errors/Enums');
const errorInfo = require('../services/Errors/info');


// Crea una instancia de Carrito
const carrito = new Carrito();



// Configura la ruta para mostrar el carrito
/**
 * @swagger
 * /carts/{cid}:
 *   get:
 *     summary: Obtiene los productos de un carrito por su ID.
 *     parameters:
 *       - in: path
 *         name: cid
 *         required: true
 *         description: ID del carrito.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Productos del carrito obtenidos correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Carrito'
 *       '500':
 *         description: Error al obtener los productos del carrito.
 */
router.get('/carts/:cid', async (req, res) => {
  try {
    const cartId = req.params.cid; // Obtener el cartId desde los parámetros de la URL
    const productosCarrito = await carritoService.obtenerProductosCarrito(cartId); // Obtener los productos del carrito

    res.render('carrito', { productosCarrito, cartId }); 
  } catch (error) {
    res.status(500).send('Error al obtener los productos del carrito');
  }
});
//End


// Para buscar un carrito por su ID con Promesas
const carritoID = new ObjectId(1);

Carts.findById(carritoID)
  .then(cart => {
    if (!cart) {
      console.log('Carrito no encontrado');
    } else {
      console.log('Carrito encontrado:', cart);
    }
  })
  .catch(error => {
    console.error('Error al buscar el carrito:', error);
  });


// Ruta para crear un nuevo carrito
/**
 * @swagger
 * /carts:
 *   post:
 *     summary: Crea un nuevo carrito.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       description: Identificador único del producto.
 *                     quantity:
 *                       type: integer
 *                       description: Cantidad del producto en el carrito.
 *             example:
 *               Products:
 *                 - productId: 609ba5625bea7b228cc3565b
 *                   quantity: 2
 *                 - productId: 609ba5625bea7b228cc3565c
 *                   quantity: 1
 *     responses:
 *       '201':
 *         description: Nuevo carrito creado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Carrito'
 */
router.post('/'/*, authorizationMiddleware('admin')*/, (req, res) => {
    const nuevoCarrito = carrito.crearCarrito(req.body.Products);
    console.log("Nuevo carrito creado:", nuevoCarrito);
    res.status(201).json(nuevoCarrito);
});
//End

//Buscar el carrito
/**
 * @swagger
 * /carritos/{cid}:
 *   get:
 *     summary: Obtiene los productos de un carrito por su ID.
 *     parameters:
 *       - in: path
 *         name: cid
 *         required: true
 *         description: ID del carrito.
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       '200':
 *         description: Productos del carrito obtenidos correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProductosCarrito'
 *       '404':
 *         description: El carrito no fue encontrado.
 */
router.get('/:cid', (req, res) => {
    const carritoID = parseInt(req.params.cid);

    // Busca el carrito por ID
    const carritoEncontrado = carrito.Carritos.find((c) => c.ID === carritoID);

    if (carritoEncontrado) {
        res.json(carritoEncontrado.Products);
    } else {
        res.status(404).json({ error: 'Carrito no encontrado' });
    }
});
//End

// Ruta para agregar productos a un carrito
/**
 * @swagger
 * /carritos/{cid}/product/{pid}:
 *   post:
 *     summary: Agrega un producto al carrito especificado.
 *     parameters:
 *       - in: path
 *         name: cid
 *         required: true
 *         description: ID del carrito al que se agregará el producto.
 *         schema:
 *           type: integer
 *           format: int64
 *       - in: path
 *         name: pid
 *         required: true
 *         description: ID del producto que se agregará al carrito.
 *         schema:
 *           type: integer
 *           format: int64
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 description: Cantidad del producto a agregar al carrito. Si no se especifica, se asume 1.
 *                 default: 1
 *     responses:
 *       '201':
 *         description: Producto agregado al carrito correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Carrito'
 *       '404':
 *         description: Error al agregar el producto al carrito o carrito no encontrado.
 */
router.post('/:cid/product/:pid'/*, authorizationMiddleware('user')*/, (req, res, next) => {
  const carritoID = parseInt(req.params.cid);
  const productoID = parseInt(req.params.pid);

  // Busca el carrito por ID
  const carritoEncontrado = carrito.Carritos.find((c) => c.ID === carritoID);

  if (carritoEncontrado) {
    console.log("Carrito encontrado:", carritoEncontrado);

    // Obtener el precio del producto
    const price = productManagerInstance.obtenerPrecioProducto(productoID);

    if (price !== null) {
      const product = {
        product: productoID,
        quantity: 1,
        price: price // Agregar el precio al objeto product
      };

      // Verifica si el producto ya existe en el carrito
      const existingProductIndex = carritoEncontrado.Products.findIndex((p) => p.product === productoID);

      if (existingProductIndex !== -1) {
        // Si ya existe, aumenta la cantidad en 1
        carritoEncontrado.Products[existingProductIndex].quantity += 1;
      } else {
        // Si no existe, agrega el producto al carrito
        carritoEncontrado.Products.push(product);
      }

      console.log("Productos en el carrito después de agregar:", carrito.obtenerCarritoPorId(carritoID));

      res.status(201).json(carritoEncontrado);
    } else {
      // Manejo de error para "Producto no encontrado"
      const errorMessage = "El producto no existe o no tiene precio.";
      const errorStatusCode = 404;
      next(new CustomError(errorMessage, errorStatusCode));
    }
  } else {
    // Manejo de error para "Error al agregar al carrito"
    const errorMessage = errorInfo[Enums.ERROR_ADD_TO_CART].message;
    const errorStatusCode = 404;
    next(new CustomError(errorMessage, errorStatusCode));
  }

  const io = req.app.get('io'); // Obtiene el objeto Socket.io
  io.emit('productoCambiado');
});

//End




// DELETE api/carts/:cid/products/:pid: Eliminar un producto del carrito
/**
 * @swagger
 * /carritos/{cid}/products/{pid}:
 *   delete:
 *     summary: Elimina un producto del carrito especificado.
 *     parameters:
 *       - in: path
 *         name: cid
 *         required: true
 *         description: ID del carrito del que se eliminará el producto.
 *         schema:
 *           type: integer
 *           format: int64
 *       - in: path
 *         name: pid
 *         required: true
 *         description: ID del producto que se eliminará del carrito.
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       '200':
 *         description: Producto eliminado del carrito correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje indicando que el producto se eliminó correctamente.
 *       '404':
 *         description: Error al eliminar el producto del carrito o carrito no encontrado.
 */
router.delete('/:cid/products/:pid', (req, res) => {
  const cartId = parseInt(req.params.cid);
  const productId = parseInt(req.params.pid);

  const cartIndex = carrito.Carritos.findIndex(c => c.ID === cartId);

  if (cartIndex === -1) {
    return res.status(404).json({ error: 'Carrito no encontrado' });
  }

  const cart = carrito.Carritos[cartIndex];

  const productIndex = cart.Products.findIndex(p => p.product === productId);

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
  }

  cart.Products.splice(productIndex, 1);

  return res.json({ message: 'Producto eliminado del carrito correctamente' });
});
//End


  
  
// PUT api/carts/:cid: Actualizar el carrito con un arreglo de productos
/**
 * @swagger
 * /carritos/{cid}:
 *   put:
 *     summary: Actualiza el carrito especificado con un nuevo arreglo de productos.
 *     parameters:
 *       - in: path
 *         name: cid
 *         required: true
 *         description: ID del carrito que se actualizará.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 description: Nuevo arreglo de productos para actualizar el carrito.
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       description: ID del producto.
 *                     quantity:
 *                       type: integer
 *                       description: Cantidad del producto.
 *     responses:
 *       '200':
 *         description: Carrito actualizado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje indicando que el carrito se actualizó correctamente.
 *       '404':
 *         description: Carrito no encontrado.
 *       '500':
 *         description: Error interno del servidor al actualizar el carrito.
 */
  router.put('/:cid', async (req, res) => {
    try {
      const carts = await Carts.findById(req.params.cid);
  
      if (!carts) {
        return res.status(404).json({ error: 'Carrito no encontrado' });
      }
  
      carts.products = req.body.products;
      await carts.save();
  
      res.json({ message: 'Carrito actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar el carrito:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
//End
  


// PUT api/carts/:cid/products/:pid: Actualizar la cantidad de un producto en el carrito
/**
 * @swagger
 * /api/carts/{cid}/products/{pid}:
 *   put:
 *     summary: Actualiza la cantidad de un producto en el carrito especificado.
 *     parameters:
 *       - in: path
 *         name: cid
 *         required: true
 *         description: ID del carrito que contiene el producto a actualizar.
 *         schema:
 *           type: string
 *       - in: path
 *         name: pid
 *         required: true
 *         description: ID del producto que se actualizará en el carrito.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 description: Nueva cantidad del producto en el carrito.
 *     responses:
 *       '200':
 *         description: Cantidad del producto actualizada correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje indicando que la cantidad del producto se actualizó correctamente.
 *       '404':
 *         description: Carrito o producto no encontrado en el carrito.
 */
router.put('/:cid/products/:pid', (req, res) => {
  const cartId = parseInt(req.params.cid);
  const productId = parseInt(req.params.pid);
  const newQuantity = parseInt(req.body.quantity);

  const cartIndex = carrito.Carritos.findIndex(c => c.ID === cartId);

  if (cartIndex === -1) {
    return res.status(404).json({ error: 'Carrito no encontrado' });
  }

  const cart = carrito.Carritos[cartIndex];

  const productIndex = cart.Products.findIndex(p => p.product === productId);

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
  }

  cart.Products[productIndex].quantity = newQuantity;

  return res.json({ message: 'Cantidad del producto actualizada correctamente' });
});

  
// DELETE api/carts/:cid: Eliminar todos los productos del carrito
/**
 * @swagger
 * /api/carts/{cid}:
 *   delete:
 *     summary: Elimina todos los productos del carrito.
 *     parameters:
 *       - in: path
 *         name: cid
 *         required: true
 *         description: ID del carrito del que se eliminarán los productos.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Todos los productos fueron eliminados del carrito correctamente.
 *       '404':
 *         description: Carrito no encontrado.
 */
router.delete('/:cid', (req, res) => {
  const cartId = parseInt(req.params.cid);

  const cartIndex = carrito.Carritos.findIndex(c => c.ID === cartId);

  if (cartIndex === -1) {
    return res.status(404).json({ error: 'Carrito no encontrado' });
  }

  const cart = carrito.Carritos[cartIndex];

  cart.Products = [];

  return res.json({ message: 'Todos los productos fueron eliminados del carrito' });
});
//End
  
// GET api/carts/:cid: Obtener el carrito con productos completos
/**
 * @swagger
 * /api/carts/{cid}:
 *   get:
 *     summary: Obtiene el carrito con productos completos por su ID.
 *     parameters:
 *       - in: path
 *         name: cid
 *         required: true
 *         description: ID del carrito que se desea obtener.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Carrito obtenido correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CarritoCompleto'
 *       '404':
 *         description: Carrito no encontrado.
 *       '500':
 *         description: Error interno del servidor.
 */
router.get('/:cid', async (req, res) => {
  try {
    const cartId = req.params.cid;
    const cart = carrito.obtenerCarritoPorId(cartId);

    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }

    res.json(cart);
  } catch (error) {
    console.error('Error al obtener el carrito:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});



//Ruta para generar el ticket
/**
 * @swagger
 * /api/tickets/{cid}/purchase:
 *   post:
 *     summary: Genera un ticket de compra para el carrito especificado.
 *     parameters:
 *       - in: path
 *         name: cid
 *         required: true
 *         description: ID del carrito para el cual se desea generar el ticket.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Ticket generado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensaje de éxito.
 *                 ticket:
 *                   $ref: '#/components/schemas/Ticket'
 *       '400':
 *         description: Algunos productos no pudieron procesarse completamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensaje de error.
 *                 productosNoProcesados:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Lista de IDs de productos que no pudieron procesarse completamente.
 *       '404':
 *         description: Carrito no encontrado.
 *       '500':
 *         description: Error interno del servidor.
 */
router.post('/api/tickets/:cid/purchase', async (req, res) => {
    console.log('Entró a la ruta de generación de tickets');
    const carritoID = parseInt(req.params.cid);

    // Obtén el carrito por ID
    const carritoEncontrado = carrito.Carritos.find((c) => c.ID === carritoID);
    console.log('Carrito encontrado:', carritoEncontrado);
    if (!carritoEncontrado) {
        return res.status(404).json({ error: 'Carrito no encontrado' });
    }

    // Validar el stock y generar ticket
    const productosNoProcesados = [];
    for (const producto of carritoEncontrado.Products) {
        const productoEncontrado = productManagerInstance.obtenerProductoPorID(producto.ID);

        if (!productoEncontrado || producto.Cantidad > productoEncontrado.Cantidad) {
            // Producto no encontrado o no hay suficiente stock
            productosNoProcesados.push(producto.ID);
            continue;
        }

        // Restar el stock
        productoEncontrado.Cantidad -= producto.Cantidad;
        await productoEncontrado.save();
    }

    if (productosNoProcesados.length > 0) {
      console.log('Algunos productos no pudieron procesarse completamente', productosNoProcesados);
        return res.status(400).json({ error: 'Algunos productos no pudieron procesarse completamente', productosNoProcesados });
    }

    // Calcular el monto total del carrito
    const totalAmount = carritoEncontrado.Products.reduce((total, producto) => {
        const productoEncontrado = productManagerInstance.obtenerProductoPorID(producto.ID);
        return total + (productoEncontrado ? productoEncontrado.Precio * producto.Cantidad : 0);
    }, 0);

    // Crear el ticket
    const nuevoTicket = new Ticket({
        code: generateUniqueTicketCode(),
        amount: totalAmount,
        purchaser: req.user.email
    });

    await nuevoTicket.save();
    console.log('Se generó el ticket con éxito');

    // Eliminar el carrito después de la compra
    carrito.Carritos = carrito.Carritos.filter((c) => c.ID !== carritoID);

    res.json({ message: 'Compra realizada con éxito', ticket: nuevoTicket });
});



// Función para generar un código de ticket único
/**
 * @swagger
 * /api/tickets/generateUniqueTicketCode:
 *   get:
 *     summary: Genera un código único para un ticket.
 *     responses:
 *       '200':
 *         description: Código de ticket generado con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TicketCode'
 */
function generateUniqueTicketCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}


module.exports = router;