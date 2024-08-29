const request = require('supertest');
const server = require('../../../server');

async function getSearchItems(keywords, authToken) {
  const requestObject = request(server)
    .get(`/api/1.0/groups/items/search?keyword=${keywords}&itemTypes=0`);
  if (authToken) {
    requestObject.set('Authorization', `Bearer ${authToken}`);
  }
  return requestObject;
}

async function patchItem(groupId, itemId, patchItemRequest, authToken) {
  const requestObject = request(server)
    .patch(`/api/1.0/groups/${groupId}/items/${itemId}`)
    .set('Content-Type', 'application/json')
    .send(patchItemRequest);
  if (authToken) {
    requestObject.set('Authorization', `Bearer ${authToken}`);
  }
  return requestObject;
}

async function deleteItem(groupId, itemId, authToken) {
  const requestObject = request(server)
    .delete(`/api/1.0/groups/${groupId}/items/${itemId}`);
  if (authToken) {
    requestObject.set('Authorization', `Bearer ${authToken}`);
  }
  return requestObject;
}

module.exports = {
  getSearchItems, patchItem, deleteItem,
};
