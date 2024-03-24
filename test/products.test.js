import chai from 'chai';
import supertest from 'supertest';
import mongoose from 'mongoose';


const { expect } = chai;
const requester = supertest('http://localhost:8080');

describe('Products Router', () => {
  it('Debería retornar una lista de productos cuando GET /api/products es llamada', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');

  });

  it('Debería eliminar un producto correctamente', async () => {
    // Simula la eliminación de un producto
    const productoEliminado = await eliminarProducto(8); // Simula la eliminación del producto con ID 8

    // Verifica que el producto haya sido eliminado correctamente
    expect(productoEliminado).to.exist; // Asegura que se haya devuelto un producto
    expect(productoEliminado.ID).to.equal(8); // Verifica que el ID del producto eliminado sea el correcto

    // Verifica que el producto eliminado ya no exista en la lista de productos
    const productosDespuesDeEliminacion = await obtenerListaDeProductos(); 
    const productoEliminadoExistente = productosDespuesDeEliminacion.find(producto => producto.ID === 8);
    expect(productoEliminadoExistente).to.not.exist; 
 
  });

  it('Debería agregar un producto correctamente', async () => {
    // Simula la adición de un producto
    const nuevoProducto = {
      Titulo: 'Nuevo Producto',
      Descripcion: 'Descripción del Nuevo Producto',
      Precio: 100,
      Miniatura: 'miniatura.jpg',
      Codigo: 'NP001',
      Cantidad: 10
    };

    await agregarProducto(nuevoProducto.Titulo, nuevoProducto.Descripcion, nuevoProducto.Precio, nuevoProducto.Miniatura, nuevoProducto.Codigo, nuevoProducto.Cantidad);

  });
});