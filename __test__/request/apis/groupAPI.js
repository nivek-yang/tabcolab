const request = require('supertest');
const server = require('../../../server');

// OPTION: We can build a GroupAPI class and use a constructor with authToken.
// This would allow us to use this.authToken in our methods instead of passing it as a parameter.

async function getGroup(authToken) {
  const requestObject = request(server)
    .get('/api/1.0/groups');
  if (authToken) {
    requestObject.set('Authorization', `Bearer ${authToken}`);
  }
  return requestObject;
}
async function postGroup(newGroupData, authToken) {
  const requestObject = request(server)
    .post('/api/1.0/groups')
    .set('Content-Type', 'application/json')
    .send(newGroupData);
  if (authToken) {
    requestObject.set('Authorization', `Bearer ${authToken}`);
  }
  return requestObject;
}

async function patchGroup(groupId, patchGroupRequest, authToken) {
  const requestObject = request(server)
    .patch(`/api/1.0/groups/${groupId}`)
    .set('Content-Type', 'application/json')
    .send(patchGroupRequest);
  if (authToken) {
    requestObject.set('Authorization', `Bearer ${authToken}`);
  }
  return requestObject;
}

async function deleteGroup(groupId, authToken) {
  const requestObject = request(server)
    .delete(`/api/1.0/groups/${groupId}`);
  if (authToken) {
    requestObject.set('Authorization', `Bearer ${authToken}`);
  }
  return requestObject;
}

module.exports = {
  getGroup, postGroup, patchGroup, deleteGroup,
};
