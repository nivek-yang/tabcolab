const request = require('supertest');
const server = require('../../../server');

async function registerUser(userData) {
  const requestObject = request(server)
    .post('/api/1.0/users/register')
    .set('Content-Type', 'application/json')
    .send(userData);
  const response = await requestObject;
  return response;
}

async function loginUser(userData) {
  const requestObject = request(server)
    .post('/api/1.0/users/login')
    .set('Content-Type', 'application/json')
    .send(userData);
  const response = await requestObject;
  return response;
}
async function getUser(authToken) {
  const requestObject = request(server)
    .get('/api/1.0/user');
  if (authToken) {
    requestObject.set('Authorization', `Bearer ${authToken}`);
  }
  const response = await requestObject;
  return response;
}

async function getAllUsers(authToken) {
  const requestObject = request(server)
    .get('/api/1.0/users');
  if (authToken) {
    requestObject.set('Authorization', `Bearer ${authToken}`);
  }
  const response = await requestObject;
  return response;
}

async function patchUser(requestBody, authToken) {
  const requestObject = request(server)
    .patch('/api/1.0/user')
    .set('Content-Type', 'application/json')
    .send(requestBody);
  if (authToken) {
    requestObject.set('Authorization', `Bearer ${authToken}`);
  }
  const response = await requestObject;
  return response;
}

async function deleteUser(authToken) {
  const requestObject = request(server)
    .delete('/api/1.0/user');
  if (authToken) {
    requestObject.set('Authorization', `Bearer ${authToken}`);
  }
  const response = await requestObject;
  return response;
}

module.exports = {
  registerUser, loginUser, getUser, getAllUsers, patchUser, deleteUser,
};
