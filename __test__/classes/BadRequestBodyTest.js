const { handleException } = require('../utils/testErrorHandler');
const { validateApiResponse } = require('../utils/apiTestHelper');
const { getNewToken } = require('../utils/getNewToken');

class BadRequestBodyTest {
  constructor(apiAction, userData, requestData = null) {
    this.apiAction = apiAction;
    this.userData = userData;
    this.requestData = requestData;
  }

  async jsonFormatError(invalidJson, additionalParams = []) {
    let res;
    try {
      const params = [...additionalParams, invalidJson];
      res = await validateApiResponse(this.apiAction, params, 400, 'fail', 'Invalid JSON format in request body');
    } catch (e) {
      handleException(res, e);
    }
  }

  async noFieldError(emptyRequestData = {}, authToken = null, expectedMessage = 'is required', additionalParams = []) {
    let res;
    try {
      const params = [...additionalParams, emptyRequestData, authToken];
      res = await validateApiResponse(this.apiAction, params, 400, 'fail', expectedMessage, 'toMatch');
    } catch (e) {
      handleException(res, e);
    }
  }

  async missingFieldError(authToken = null, additionalParams = []) {
    const testData = Object.keys(this.requestData);
    for (const field of testData) {
      it(`Missing ${field} field`, async () => {
        const token = await getNewToken(this.userData);
        const Token = authToken || token;
        let res;
        try {
          const { [field]: removedField, ...newRequestData } = this.requestData;
          const params = [...additionalParams, newRequestData, Token];
          res = await validateApiResponse(this.apiAction, params, 400, 'fail', `"${field}" is required`);
        } catch (e) {
          handleException(res, e);
        }
      });
    }
  }

  async undefinedFieldError(authToken = null, expectedMessage = 'not allowed', additionalParams = []) {
    this.requestData.undefinedField = 'undefined';
    let res;
    try {
      const params = [...additionalParams, this.requestData, authToken];
      res = await validateApiResponse(this.apiAction, params, 400, 'fail', expectedMessage, 'toMatch');
    } catch (e) {
      handleException(res, e);
    } finally {
      delete this.requestData.undefinedField;
    }
  }

  async fieldDataFormatError(authToken = null, additionalParams = [], expectedMessage = null) {
    const fieldTypesRequired = {
      browserTab_id: 'number',
      browserTab_index: 'number',
      browserTab_active: 'boolean',
      windowId: 'number',
      targetItem_position: 'number',
      item_type: 'number',
      doneStatus: 'boolean',
    };
    const testValues = {
      string: {
        number: 88888888,
        boolean: true,
      },
      number: {
        string: 'test',
        boolean: true,
      },
      boolean: {
        string: 'test',
        number: 88888888,
      },
    };
    const requestDataFields = Object.keys(this.requestData);
    const testReqData = requestDataFields.map((field) => ({
      field,
      values: testValues[fieldTypesRequired[field] || 'string'],
    }));
    for (const { field, values } of testReqData) {
      for (const [type, value] of Object.entries(values)) {
        const fieldTypeRequired = fieldTypesRequired[field] || 'string';
        it(`${field} field required ${fieldTypeRequired} (but value type: ${type})`, async () => {
          const token = await getNewToken(this.userData);
          const Token = authToken || token;
          const testData = { ...this.requestData };
          testData[field] = value;
          let res;
          try {
            const params = [...additionalParams, testData, Token];
            const errorMessage = expectedMessage || `"${field}" must be a ${fieldTypeRequired}`;
            res = await validateApiResponse(this.apiAction, params, 400, 'fail', errorMessage);
          } catch (e) {
            handleException(res, e);
          }
        });
      }
    }
  }
}

module.exports = { BadRequestBodyTest };
