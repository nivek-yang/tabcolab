const request = require('supertest');
const { handleException } = require('../../utils/testErrorHandler');
const { groupsChanges } = require('../../utils/groupsChanges');
const GroupValidator = require('../../validations/group');
const ItemValidator = require('../../validations/item');
const { UserGroupTest } = require('../../classes/UserTest');
const {
  getGroup, postGroup, patchGroup, deleteGroup,
} = require('../apis/groupAPI');
const { registerUser, loginUser } = require('../apis/userAPI');
const { validateApiResponse } = require('../../utils/apiTestHelper');
const { BadRequestBodyTest } = require('../../classes/BadRequestBodyTest');

const GroupTest = async (server) => {
  let authToken;
  let userData = { email: 'user@example.com', password: 'mySecurePassword123' };

  beforeAll(async () => {
    const res = await loginUser(userData);
    authToken = res.body.token;
  });

  describe('Get /groups', () => {
    it('200: success', async () => {
      let res;
      try {
        res = await getGroup(authToken);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        const itemValidator = new ItemValidator();
        const groupValidator = new GroupValidator(itemValidator);

        res.body.forEach((group) => {
          groupValidator.validate(group);
        });
      } catch (e) {
        handleException(res, e);
      }
    });
    it('404: No groups found for the new registered user', async () => {
      const groupTest = new UserGroupTest(registerUser, getGroup);
      userData = { email: 'newuser@example.com', password: 'mySecurePassword123' };
      await groupTest.registerAndTestGroupNotFound(userData);
    });
    describe('401: JWT problem', () => {
      it('Missing JWT', async () => {
        let res;
        try {
          res = await validateApiResponse(getGroup, [], 401, 'fail', 'Missing JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
      it('Invalid JWT', async () => {
        let res;
        try {
          res = await validateApiResponse(getGroup, [123], 401, 'fail', 'Invalid JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
    });
  });

  describe('POST /group', () => {
    let newGroupData = {
      group_icon: 'icon-url',
      group_title: 'New Group',
    };
    beforeEach(() => {
      newGroupData = {
        group_icon: 'icon-url',
        group_title: 'New Group',
      };
    });

    describe('createGroup(Blank): should create a new group => 前端已棄用僅供測試', () => {
      it('201: should successfully create a new group', async () => {
        let res;
        try {
          const oldResult = await getGroup(authToken);

          res = await validateApiResponse(postGroup, [newGroupData, authToken], 201, null, 'Group created at blank successfully');

          const groupID = res.body.group_id;

          const newResult = await getGroup(authToken);
          const result = groupsChanges(oldResult.body, newResult.body);
          expect(result.addedItems[0].group_id).toBe(groupID);
          expect(result.addedItems[0].items).toEqual([]);
        } catch (e) {
          handleException(res, e);
        }
      });
    });
    describe('createGroup(SidebarTab)', () => {
      const newSidebarTabData = {
        group_icon: 'test_group_icon',
        group_title: 'test_group_title',
        browserTab_favIconURL: 'test_favIconURL',
        browserTab_title: 'SidebarTab_title',
        browserTab_url: 'test_url',
        browserTab_id: 456,
        browserTab_index: 7,
        browserTab_active: false,
        browserTab_status: 'complete',
        windowId: 8438513405,
      };
      it('201: create SidebarTab within a new group', async () => {
        let res;
        try {
          const oldResult = await getGroup(authToken);

          res = await validateApiResponse(postGroup, [newSidebarTabData, authToken], 201, null, 'Group created with sidebar tab successfully');

          const groupID = res.body.group_id;
          const itemID = res.body.item_id;

          const newResult = await getGroup(authToken);
          const result = groupsChanges(oldResult.body, newResult.body);

          expect(result.addedItems[0].group_id).toBe(groupID);
          expect(result.addedItems[0].items[0].item_id).toBe(itemID);
          expect(result.addedItems[0].items[0].item_type).toBe(0);
        } catch (e) {
          handleException(res, e);
        }
      });
      describe('401: JWT problem', () => {
        it('Missing JWT', async () => {
          let res;
          try {
            res = await validateApiResponse(postGroup, [newSidebarTabData], 401, 'fail', 'Missing JWT');
          } catch (e) {
            handleException(res, e);
          }
        });
        it('Invalid JWT', async () => {
          let res;
          try {
            res = await validateApiResponse(postGroup, [newSidebarTabData, 123], 401, 'fail', 'Invalid JWT');
          } catch (e) {
            handleException(res, e);
          }
        });
      });
      describe('400 Bad request: Body Format Error', () => {
        const groupTest = new BadRequestBodyTest(postGroup, userData, newSidebarTabData);
        it('JSON Format Error', async () => {
          const invalidJson = '{ group_icon: }';
          await groupTest.jsonFormatError(invalidJson);
        });
        it('No field', async () => {
          await groupTest.noFieldError({}, authToken, 'Invalid request body');
        });
        it('Undefined Field', async () => {
          await groupTest.undefinedFieldError(authToken, 'Invalid request body');
        });
        // describe('Missing field', () => {
        //   groupTest.missingFieldError(authToken);
        // });
      });

      describe('400 Bad request: Field Data Format Error', () => {
        const groupTest = new BadRequestBodyTest(postGroup, userData, newSidebarTabData);
        groupTest.fieldDataFormatError(authToken);
      });
    });
    describe('createGroup(GroupTab) => 測試吃不到既有groupID和itemID', () => {
      let newGroupTabData = {
        group_icon: 'test_group_icon',
        group_title: 'test_group_title',
        sourceGroup_id: '2',
        item_id: '4',
      };

      beforeEach(() => {
        newGroupTabData = {
          group_icon: 'test_group_icon',
          group_title: 'test_group_title',
          sourceGroup_id: '2',
          item_id: '4',
        };
      });

      it('201: create GroupTab within a new group', async () => {
        let res;
        try {
          const oldResult = await getGroup(authToken);

          res = await validateApiResponse(postGroup, [newGroupTabData, authToken], 201, null, 'Group created with group tab successfully');

          const newResult = await getGroup(authToken);

          const result = groupsChanges(oldResult.body, newResult.body);

          expect(result.addedItems[0].group_id).toBe(res.body.group_id);
          expect(result.addedItems[0].items[0].item_id).toBe(newGroupTabData.item_id);
          expect(result.addedItems[0].items[0].item_type).toBe(0);
        } catch (e) {
          handleException(res, e);
        }
      });

      describe('400 Bad request: Body Format Error', () => {
        const groupTest = new BadRequestBodyTest(postGroup, userData, newGroupTabData);
        it('JSON Format Error', async () => {
          const invalidJson = '{ group_icon: }';
          await groupTest.jsonFormatError(invalidJson);
        });
        it('No field', async () => {
          await groupTest.noFieldError({}, authToken, 'Invalid request body');
        });
        it('Undefined Field', async () => {
          await groupTest.undefinedFieldError(authToken, 'Invalid request body');
        });
        // describe('Missing field', () => {
        //   groupTest.missingFieldError(authToken);
        // });
      });

      describe('400 Bad request: Field Data Format Error', () => {
        const groupTest = new BadRequestBodyTest(postGroup, userData, newGroupTabData);
        groupTest.fieldDataFormatError(authToken);
      });
      describe('404', () => {
        it('404: invalid groupID', async () => {
          newGroupTabData.sourceGroup_id = '100';
          let res;
          try {
            const oldResult = await getGroup(authToken);
            res = await validateApiResponse(postGroup, [newGroupTabData, authToken], 404, 'fail', 'Group not found or invalid group ID');

            const newResult = await getGroup(authToken);

            const result = groupsChanges(oldResult.body, newResult.body);

            expect(result.addedItems).toEqual([]);
            expect(result.deletedItems).toEqual([]);
          } catch (e) {
            handleException(res, e);
          }
        });
        it('404: invalid item ID', async () => {
          newGroupTabData.item_id = '100';
          let res;
          try {
            const oldResult = await getGroup(authToken);
            res = await validateApiResponse(postGroup, [newGroupTabData, authToken], 404, 'fail', 'Item not found in source group');

            const newResult = await getGroup(authToken);

            const result = groupsChanges(oldResult.body, newResult.body);

            expect(result.addedItems).toEqual([]);
            expect(result.deletedItems).toEqual([]);
          } catch (e) {
            handleException(res, e);
          }
        });
      });
    });
  });

  describe('PATCH /groups/:group_id', () => {
    const groupId = '10'; // 假設這是要刪除的群組的ID，無法預先指定
    let patchGroupRequest;
    describe('Patch Group Title', () => {
      patchGroupRequest = {
        group_title: 'Updated Group Title',
      };
      beforeAll(async () => {
        patchGroupRequest = {
          group_title: 'Updated Group Title',
        };
      });
      it('200: Patch Group Title', async () => {
        let res;
        try {
          res = await validateApiResponse(patchGroup, [groupId, patchGroupRequest, authToken], 200, null, 'Group info updated successfully');
        } catch (e) {
          handleException(res, e);
        }
      });
      describe('400 Bad request: Body Format Error', () => {
        const groupTest = new BadRequestBodyTest(patchGroup, userData, patchGroupRequest);
        it('JSON Format Error', async () => {
          const invalidJson = '{ group_icon: }';
          await groupTest.jsonFormatError(invalidJson, [groupId]);
        });
        it('No field', async () => {
          await groupTest.noFieldError({}, authToken, 'Invalid request body', [groupId]);
        });
        it('Undefined Field', async () => {
          await groupTest.undefinedFieldError(authToken, 'not allowed', [groupId]);
        });
        // describe('Missing field', () => {
        //   groupTest.missingFieldError(authToken);
        // });
      });
      describe('400 Bad request: Field Data Format Error', () => {
        const groupTest = new BadRequestBodyTest(patchGroup, userData, patchGroupRequest);
        groupTest.fieldDataFormatError(authToken, [groupId]);
      });
    });

    describe('Patch Group Icon', () => {
      patchGroupRequest = {
        group_icon: 'https://example.com/updated_icon.png',
      };
      beforeAll(async () => {
        patchGroupRequest = {
          group_icon: 'https://example.com/updated_icon.png',
        };
      });

      it('200: Patch Group Icon', async () => {
        let res;
        try {
          res = await validateApiResponse(patchGroup, [groupId, patchGroupRequest, authToken], 200, null, 'Group info updated successfully');
        } catch (e) {
          handleException(res, e);
        }
      });
      describe('400 Bad request: Body Format Error', () => {
        const groupTest = new BadRequestBodyTest(patchGroup, userData, patchGroupRequest);
        it('JSON Format Error', async () => {
          const invalidJson = '{ group_icon: }';
          await groupTest.jsonFormatError(invalidJson, [groupId]);
        });
        it('No field', async () => {
          await groupTest.noFieldError({}, authToken, 'Invalid request body', [groupId]);
        });
        it('Undefined Field', async () => {
          await groupTest.undefinedFieldError(authToken, 'not allowed', [groupId]);
        });
        // describe('Missing field', () => {
        //   groupTest.missingFieldError(authToken);
        // });
      });
    });

    describe('400 Bad request: Field Data Format Error', () => {
      const groupTest = new BadRequestBodyTest(patchGroup, userData, patchGroupRequest);
      groupTest.fieldDataFormatError(authToken, [groupId]);
    });
    describe('401: JWT problem', () => {
      it('Missing JWT', async () => {
        let res;
        try {
          res = await validateApiResponse(patchGroup, [groupId, patchGroupRequest], 401, 'fail', 'Missing JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
      it('Invalid JWT', async () => {
        let res;
        try {
          res = await validateApiResponse(patchGroup, [groupId, patchGroupRequest, 123], 401, 'fail', 'Invalid JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
    });
    it('404: invaild Group ID', async () => {
      const groupId = '100'; // 假設這是要刪除的群組的ID，無法預先指定
      patchGroupRequest = {
        group_icon: 'https://example.com/updated_icon.png',
      };
      let res;
      try {
        res = await validateApiResponse(patchGroup, [groupId, patchGroupRequest, authToken], 404, 'fail', 'Group not found or invalid group ID');
      } catch (e) {
        handleException(res, e);
      }
    });
  });

  describe('Delete /groups/:group_id', () => {
    let groupIdToDelete = '10'; // 假設這是要刪除的群組的ID，無法預先指定

    it('200', async () => {
      let res;
      let result;
      try {
        const oldResult = await getGroup(authToken);
        res = await validateApiResponse(deleteGroup, [groupIdToDelete, authToken], 204, null, null);

        const newResult = await getGroup(authToken);

        result = groupsChanges(oldResult.body, newResult.body);
        // console.log(JSON.stringify(result, null, 2));

        expect(result.deletedItems[0].group_id).toBe('10');
      } catch (e) {
        handleException(res, e);
      }
    });
    it('404: valid groupId', async () => {
      groupIdToDelete = '100';
      let res;
      try {
        const oldResult = await getGroup(authToken);
        res = await validateApiResponse(deleteGroup, [groupIdToDelete, authToken], 404, 'fail', 'Group not found');

        const newResult = await getGroup(authToken);

        const result = groupsChanges(oldResult.body, newResult.body);

        expect(result.addedItems).toEqual([]);
        expect(result.deletedItems).toEqual([]);
      } catch (e) {
        handleException(res, e);
      }
    });
    describe('401: JWT problem', () => {
      it('Missing JWT', async () => {
        let res;
        try {
          res = await validateApiResponse(deleteGroup, [groupIdToDelete], 401, 'fail', 'Missing JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
      it('Invalid JWT', async () => {
        let res;
        try {
          res = await validateApiResponse(deleteGroup, [groupIdToDelete, 123], 401, 'fail', 'Invalid JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
    });
  });
};

module.exports = GroupTest;
