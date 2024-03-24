import chai from 'chai';
import supertest from 'supertest';
import mongoose from 'mongoose';


const { expect } = chai;
const requester = supertest('http://localhost:8080');

describe('Carts Router', () => {
  before(async () => {
    // Conectar a la base de datos antes de ejecutar las pruebas
    await mongoose.connect('mongodb+srv://tomas:N7nYgWBBYk2hvi8@cluster0.zy2qq6q.mongodb.net/?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  after(async () => {
    // Desconectar de la base de datos después de ejecutar las pruebas
    await mongoose.disconnect();
  });

  it('Debería retornar una lista de carritos cuando GET /api/carts es llamada', async () => {
    const res = await requester.get('/api/carts');
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
  });

  it('Debería crear un nuevo carrito cuando se hace una solicitud POST a /api/carts', async () => {
    const newCartData = {
      Products: [      
      {
          "product": 1,
          "quantity": 1
      }
      ],
    };

    const res = await requester.post('/api/carts').send(newCartData);
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('ID');
    expect(res.body.Products).to.be.an('array');
  });

  it('Debería eliminar un producto del carrito cuando se hace una solicitud DELETE a /api/carts/:cid/products/:pid', async () => {
    
    const cartId = 1; 
    const productId = 1; 

    const res = await requester.delete(`/api/carts/${cartId}/products/${productId}`);
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message').equal('Producto eliminado del carrito correctamente');
  });
});
