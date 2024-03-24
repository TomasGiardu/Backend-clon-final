// sessions.test.js
import chai from 'chai';
import supertest from 'supertest';
import mongoose from 'mongoose';


const { expect } = chai;
const requester = supertest('http://localhost:8080');

describe('Sessions Router', () => {
  it('Debería retornar el token JWT cuando POST /api/login es llamado con claves válidas', async () => {
    const loginData = {
      username: 'example',
      password: 'password'
    };

    const res = await request(app)
      .post('/api/login')
      .send(loginData);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('token');

  });

  it('Debería configurar la sesión con almacenamiento en archivos y la cookie de sesión correctamente', async () => {
    const res = await request(app).get('/');

    expect(res.status).to.equal(200);
    expect(res.headers['set-cookie']).to.be.an('array');
  });

  it('Debería inicializar Passport correctamente', async () => {
    const res = await request(app).get('/');

    expect(res.status).to.equal(200);
  });
});