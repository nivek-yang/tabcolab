const { handleException } = require('../../utils/testErrorHandler');
const { validateApiResponse, testTokenValidity, registerUserWithUniqueEmail } = require('../../utils/apiTestHelper');
const { BadRequestBodyTest } = require('../../classes/BadRequestBodyTest');

let userData = { email: 'login@gmail.com', password: 'password1' };

const UserTest = async (server) => {
  let authToken;

  beforeEach(async () => {
    userData = { email: 'login@gmail.com', password: 'password1' };
  });

  const {
    registerUser, loginUser, getUser, getAllUsers, patchUser, deleteUser,
  } = require('../apis/userAPI');

  describe('Post /users/register', () => {
    const userTest = new BadRequestBodyTest(registerUser, userData, userData);
    it('201: User signed up successfully.', async () => {
      let res;
      try {
        res = await validateApiResponse(registerUser, [userData], 201, 'success', 'User signed up successfully.');
        authToken = res.body.token;
      } catch (e) {
        handleException(res, e);
      }
    });
    it('Token is valid', async () => {
      await testTokenValidity(authToken);
    });
    describe('400 Bad request: Body Format Error', () => {
      it('JSON Format Error', async () => {
        const invalidJson = '{ "email":123;}';
        await userTest.jsonFormatError(invalidJson);
      });
      it('No field', async () => {
        await userTest.noFieldError();
      });
      it('Undefined Field', async () => {
        await userTest.undefinedFieldError();
      });
      describe('Missing field', () => {
        userTest.missingFieldError();
      });
    });
    describe('400 Bad request: Field Data Format Error', () => {
      userTest.fieldDataFormatError();
    });
    describe('409 Conflict: Email has been registered.', () => {
      it('409: Email has been registered.', async () => {
        let res;
        try {
          const uniqueUserData = await registerUserWithUniqueEmail(userData, registerUser);

          // 再次使用相同的電子郵件地址嘗試註冊，預期會收到一個 409 錯誤
          res = await validateApiResponse(registerUser, [uniqueUserData], 409, 'fail', 'This email has already been registered');
        } catch (e) {
          handleException(res, e);
        }
      });
    });
  });

  describe('Post /users/login', () => {
    const userTest = new BadRequestBodyTest(loginUser, userData, userData);
    it('200: User signed in successfully.', async () => {
      let res;
      try {
        res = await validateApiResponse(loginUser, [userData], 200, 'success', 'User signed in successfully');
        authToken = res.body.token;
      } catch (e) {
        handleException(res, e);
      }
    });
    it('Token is valid', async () => {
      await testTokenValidity(authToken);
    });

    describe('400 Bad request: Body Format Error', () => {
      it('JSON Format Error', async () => {
        const invalidJson = '{ "email" }';
        await userTest.jsonFormatError(invalidJson);
      });
      it('No field', async () => {
        await userTest.noFieldError();
      });
      describe('Missing field', () => {
        userTest.missingFieldError();
      });
      it('Undefined Field', async () => {
        await userTest.undefinedFieldError();
      });
    });
    describe('400 Bad request: Field Data Format Error', () => {
      userTest.fieldDataFormatError();
    });
  });

  describe('Get /user', () => {
    it('200: Get user info', async () => {
      let res;
      try {
        res = await validateApiResponse(getUser, [authToken], 200);
      } catch (e) {
        handleException(res, e);
      }
    });
    describe('401: JWT problem', () => {
      it('Missing JWT', async () => {
        let res;
        try {
          res = await validateApiResponse(getUser, [], 401, 'fail', 'Missing JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
      it('Invalid JWT', async () => {
        let res;
        try {
          res = await validateApiResponse(getUser, [123], 401, 'fail', 'Invalid JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
    });
  });
  describe('Get /users', () => {
    it('200: Get all user info (only admin)', async () => {
      const adminData = { email: 'admin123@gmail.com', password: 'admin123' };

      let res;
      try {
        const adminLogin = await registerUser(adminData);
        const adminToken = adminLogin.body.token;
        res = await validateApiResponse(getAllUsers, [adminToken], 200);
      } catch (e) {
        handleException(res, e);
      }
    });
    describe('401: JWT problem', () => {
      it('Missing JWT', async () => {
        let res;
        try {
          res = await validateApiResponse(getAllUsers, [], 401, 'fail', 'Missing JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
      it('Invalid JWT', async () => {
        let res;
        try {
          res = await validateApiResponse(getAllUsers, [123], 401, 'fail', 'Invalid JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
    });
    describe('403: Access denied', () => {
      it('Not an admin, denied access', async () => {
        let res;
        try {
          res = await validateApiResponse(getAllUsers, [authToken], 403, 'fail', 'Access denied. You are not an admin.');
        } catch (e) {
          handleException(res, e);
        }
      });
    });
  });

  describe('Patch /user', () => {
    let authToken;
    const registerRequestBody = { email: 'test123@gmail.com', password: 'test123' };
    beforeAll(async () => {
      const registerRequestBody = { email: 'test123@gmail.com', password: 'test123' };
      const registerResponse = await registerUser(registerRequestBody);
      authToken = registerResponse.body.token;
    });

    let requestBody = {};
    it('200: Change Password success', async () => {
      let res;
      try {
        requestBody.password = 'test1234';
        res = await validateApiResponse(patchUser, [requestBody, authToken], 200, 'success', 'User password updated successfully');
      } catch (e) {
        handleException(res, e);
      }
    });
    it('200: Can login with new password', async () => {
      const loginRequestBody = { email: 'test123@gmail.com', password: 'test1234' };
      let res;
      try {
        res = await validateApiResponse(loginUser, [loginRequestBody], 200, 'success', 'User signed in successfully');
      } catch (e) {
        handleException(res, e);
      }
    });
    it('200: Change Email success', async () => {
      requestBody = {};
      let res;
      try {
        requestBody.email = 'test1234@gmail.com';
        res = await validateApiResponse(patchUser, [requestBody, authToken], 200, 'success', 'User info updated successfully');
      } catch (e) {
        handleException(res, e);
      }
    });
    it('200: Can login with new email', async () => {
      const loginRequestBody = { email: 'test1234@gmail.com', password: 'test1234' };
      let res;
      try {
        res = await validateApiResponse(loginUser, [loginRequestBody], 200, 'success', 'User signed in successfully');
      } catch (e) {
        handleException(res, e);
      }
    });
    describe('400 Bad request: Body Format Error', () => {
      const userTest = new BadRequestBodyTest(patchUser, userData, userData);
      userTest.fieldDataFormatError();

      it('JSON Format Error', async () => {
        const invalidJson = '{ password: }';
        await userTest.jsonFormatError(invalidJson);
      });
      it('No field', async () => {
        await userTest.noFieldError({}, authToken, 'must contain');
      });
      it('Undefined Field', async () => {
        await userTest.undefinedFieldError(authToken);
      });
    });
    describe('400 Bad request: Field Data Format Error', () => {
      it('Password length short fail', async () => {
        let res;
        const originalPassword = requestBody.password;
        try {
          requestBody.password = 'p';
          res = await validateApiResponse(patchUser, [requestBody, authToken], 400, 'fail', 'must be at least 6 characters long', 'toMatch');
        } catch (e) {
          handleException(res, e);
        } finally {
          requestBody.password = originalPassword;
        }
      });
      it('email should be email format', async () => {
        let res;
        const originalEmail = requestBody.email;
        try {
          requestBody.email = 'test1234';
          res = await validateApiResponse(patchUser, [requestBody, authToken], 400, 'fail', 'must be a valid email', 'toMatch');
        } catch (e) {
          handleException(res, e);
        } finally {
          requestBody.email = originalEmail;
        }
      });
    });
    describe('401: JWT problem', () => {
      it('Missing JWT', async () => {
        let res;
        try {
          res = await validateApiResponse(patchUser, [requestBody], 401, 'fail', 'Missing JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
      it('Invalid JWT', async () => {
        let res;
        try {
          res = await validateApiResponse(patchUser, [requestBody, 123], 401, 'fail', 'Invalid JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
    });
  });
  describe('Delete /user', () => {
    describe('401: JWT problem', () => {
      it('delete without authToken', async () => {
        let res;
        try {
          res = await validateApiResponse(deleteUser, [], 401);
        } catch (e) {
          handleException(res, e);
        }
      });
      it('delete with incorrect authToken', async () => {
        let res;
        try {
          res = await validateApiResponse(deleteUser, [123], 401, 'fail', 'Invalid JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
    });
    describe('204: delete success', () => {
      it('delete success and register again success', async () => {
        let res;
        try {
          res = await validateApiResponse(deleteUser, [authToken], 204); // 在前面測試已經被刪掉，要再加authToken
          res = await validateApiResponse(registerUser, [userData], 201, 'success', 'User signed up successfully.');
          authToken = res.body.token;
        } catch (e) {
          handleException(res, e);
        }
      });
      it('delete success and login again fail', async () => {
        let res;
        try {
          res = await validateApiResponse(deleteUser, [authToken], 204);
          res = await validateApiResponse(loginUser, [userData], 404, 'fail', 'User not found or invalid email');
        } catch (e) {
          handleException(res, e);
        }
      });
    });
  });
};

module.exports = UserTest;
