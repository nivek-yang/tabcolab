const { validateApiResponse } = require('../utils/apiTestHelper');

class UserGroupTest {
  constructor(registerUser, getGroup) {
    this.registerUser = registerUser;
    this.getGroup = getGroup;
  }

  async registerAndTestGroupNotFound(userData) {
    let res;
    try {
      const registerResponse = await this.registerUser(userData);
      const authToken = registerResponse.body.token;
      res = await validateApiResponse(this.getGroup, [authToken], 404, 'fail', 'No groups found for the user');
    } catch (e) {
      this.handleException(res, e);
    }
  }
}

module.exports = { UserGroupTest };
