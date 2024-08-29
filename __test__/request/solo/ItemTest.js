const request = require('supertest');
const { handleException } = require('../../utils/testErrorHandler');
const { getGroup } = require('../apis/groupAPI');
const { ArraysChanges } = require('../../utils/groupsChanges');
const { validateApiResponse } = require('../../utils/apiTestHelper');
const { BadRequestBodyTest } = require('../../classes/BadRequestBodyTest');

const ItemTest = async (server) => {
  let authToken;
  let userData = { email: 'user@example.com', password: 'mySecurePassword123' };
  beforeAll(async () => {
    userData = { email: 'user@example.com', password: 'mySecurePassword123' };
    const res = await request(server)
      .post('/api/1.0/users/login')
      .send(userData);
    authToken = res.body.token;
  });

  let req = { params: {}, body: {} };

  beforeEach(() => {
    req = { params: {}, body: {} };
  });

  const {
    getSearchItems, patchItem, deleteItem,
  } = require('../apis/itemAPI');

  describe('Get /items/search', () => {
    beforeEach(() => {
      req.params.keyword = ' ';
    });
    describe('401: JWT problem', () => {
      it('Missing JWT', async () => {
        let res;
        try {
          res = await validateApiResponse(getSearchItems, [req.params.keywords], 401, 'fail', 'Missing JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
      it('Invalid JWT', async () => {
        let res;
        try {
          res = await validateApiResponse(getSearchItems, [req.params.keywords, 123], 401, 'fail', 'Invalid JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
    });
    describe('no blank', () => {
      describe('no keyword', () => {
        it('empty keyword para', async () => {
          req.params.keyword = '';
          let notice;
          try {
            const res = await getSearchItems(req.params.keyword, authToken);
            notice = res;
            expect(res.status).toEqual(400);
            expect(res.body.status).toEqual('fail');
            expect(res.body.message).toEqual('Invalid Query Parameters');
          } catch (e) {
            handleException(notice, e);
          }
        });
      });
      describe('one keyword', () => {
        test('onekeyword within a groups', async () => {
          req.params.keyword = '123';
          let res;
          try {
            res = await getSearchItems(req.params.keyword, authToken);
            expect(res.body[0].browserTab_title).toEqual('123');
            expect(res.body[1].browserTab_title).toEqual('123');
          } catch (e) {
            handleException(res, e);
          }
        });
        test('onekeyword is acceptable in any case within a groups', async () => {
          req.params.keyword = 'LowercasE';
          let notice;

          try {
            let res;
            let oldResult;

            [oldResult, res] = await Promise.all([
              getSearchItems('lowercase', authToken),
              getSearchItems(req.params.keyword, authToken),
            ]);

            notice = res;
            const result = ArraysChanges(oldResult.body, res.body);
            notice = result;

            expect(result.addedItems).toEqual([]);
            expect(result.deletedItems).toEqual([]);
          } catch (e) {
            handleException(notice, e);
          }
        });

        test('onekeyword in different groups', async () => {
          req.params.keyword = 'Browser';
          let res;
          try {
            res = await getSearchItems(req.params.keyword, authToken);
            // console.log(res.body);// 重構後無法顯示
            expect(res.body[0].browserTab_title).toEqual('Browser');
            expect(res.body[1].browserTab_title).toEqual('Browser');
          } catch (e) {
            handleException(res, e);
          }
        });

        test('onekeyword not in groups', async () => {
          req.params.keyword = 'xxxxxx';
          let notice;
          try {
            const res = await getSearchItems(req.params.keyword, authToken);
            notice = res;
            expect(res.body).toEqual([]);
          } catch (e) {
            handleException(notice, e);
          }
        });
      });
    });
    describe('single blank', () => {
      describe('no keyword', () => {
        it('only one blank: no keyword return All', async () => {
          req.params.keyword = ' ';
          let res;
          try {
            res = await getSearchItems(req.params.keyword, authToken);

            const allowedTitles = ['Tab Title', 'Browser', '123', '123', 'Browser', 'LowerCase', 'SidebarTab_title', 'Tab Title'];

            const filteredTitles = res.body
              .filter((item) => allowedTitles.includes(item.browserTab_title))
              .map((item) => item.browserTab_title);

            expect(filteredTitles).toEqual(expect.arrayContaining(allowedTitles));
          } catch (e) {
            handleException(res, e);
          }
        });
      });
      describe('one keyword', () => {
        test('unusal case: blank prefix', async () => {
          req.params.keyword = ' 123';
          let notice;
          try {
            let res;
            let oldResult;

            [oldResult, res] = await Promise.all([
              getSearchItems('123', authToken),
              getSearchItems(req.params.keyword, authToken),
            ]);

            notice = res;
            const result = ArraysChanges(oldResult.body, res.body);
            notice = result;

            expect(result.addedItems).toEqual([]);
            expect(result.deletedItems).toEqual([]);
          } catch (e) {
            handleException(notice, e);
          }
        });
        test('unusal case: blank suffix', async () => {
          req.params.keyword = '123 ';
          let notice;
          try {
            let res;
            let oldResult;

            [oldResult, res] = await Promise.all([
              getSearchItems('123', authToken),
              getSearchItems(req.params.keyword, authToken),
            ]);

            notice = res;
            const result = ArraysChanges(oldResult.body, res.body);
            notice = result;

            expect(result.addedItems).toEqual([]);
            expect(result.deletedItems).toEqual([]);
          } catch (e) {
            handleException(notice, e);
          }
        });
      });
      describe('two keyword', () => {
        test('split to two keyword', async () => {
          req.params.keyword = 'Test Title';
          let res;
          try {
            res = await getSearchItems(req.params.keyword, authToken);

            res.body.forEach((item) => {
              const browserTabTitle = item.browserTab_title.toLowerCase();
              if (browserTabTitle.includes('test')) {
                expect(browserTabTitle).toMatch('test');
              } else if (browserTabTitle.includes('title')) {
                expect(browserTabTitle).toMatch('title');
              } else {
                throw new Error('Fail');
              }
            });
          } catch (e) {
            handleException(res, e);
          }
        });
      });
    });
    describe('two blank', () => {
      it('only two blank: no keyword return All', async () => {
        req.params.keyword = '  ';
        let notice;

        try {
          let res;
          let oldResult;

          [oldResult, res] = await Promise.all([
            getSearchItems(' ', authToken),
            getSearchItems(req.params.keyword, authToken),
          ]);

          notice = res;
          const result = ArraysChanges(oldResult.body, res.body);
          notice = result;

          expect(res.status).toEqual(200);
          expect(result.addedItems).toEqual([]);
          expect(result.deletedItems).toEqual([]);
        } catch (e) {
          handleException(notice, e);
        }
      });
      describe('onekeyword', () => {
        test('unusal case: blank prefix*2', async () => {
          req.params.keyword = '  123';
          let notice;
          try {
            let res;
            let oldResult;

            [oldResult, res] = await Promise.all([
              getSearchItems('123', authToken),
              getSearchItems(req.params.keyword, authToken),
            ]);

            notice = res;
            const result = ArraysChanges(oldResult.body, res.body);
            notice = result;

            expect(result.addedItems).toEqual([]);
            expect(result.deletedItems).toEqual([]);
          } catch (e) {
            handleException(notice, e);
          }
        });
        test('unusal case: blank prefix and suffix', async () => {
          req.params.keyword = ' 123 ';
          let notice;
          try {
            let res;
            let oldResult;

            [oldResult, res] = await Promise.all([
              getSearchItems('123', authToken),
              getSearchItems(req.params.keyword, authToken),
            ]);

            notice = res;
            const result = ArraysChanges(oldResult.body, res.body);
            notice = result;

            expect(result.addedItems).toEqual([]);
            expect(result.deletedItems).toEqual([]);
          } catch (e) {
            handleException(notice, e);
          }
        });
        test('unusal case: blank suffix*2', async () => {
          req.params.keyword = '123  ';
          let notice;
          try {
            let res;
            let oldResult;

            [oldResult, res] = await Promise.all([
              getSearchItems('123', authToken),
              getSearchItems(req.params.keyword, authToken),
            ]);

            notice = res;
            const result = ArraysChanges(oldResult.body, res.body);
            notice = result;

            expect(result.addedItems).toEqual([]);
            expect(result.deletedItems).toEqual([]);
          } catch (e) {
            handleException(notice, e);
          }
        });
      });
      describe('twokeyword', () => {
        test('unusal case: blank prefix', async () => {
          req.params.keyword = ' Test Title';
          let notice;
          try {
            let res;
            let oldResult;

            [oldResult, res] = await Promise.all([
              getSearchItems('Test Title', authToken),
              getSearchItems(req.params.keyword, authToken),
            ]);

            notice = res;
            const result = ArraysChanges(oldResult.body, res.body);
            notice = result;

            expect(result.addedItems).toEqual([]);
            expect(result.deletedItems).toEqual([]);
          } catch (e) {
            handleException(notice, e);
          }
        });
        test('unusal case: blank *2 between', async () => {
          req.params.keyword = 'Test  Title';
          let notice;
          try {
            let res;
            let oldResult;

            [oldResult, res] = await Promise.all([
              getSearchItems('Test Title', authToken),
              getSearchItems(req.params.keyword, authToken),
            ]);

            notice = res;
            const result = ArraysChanges(oldResult.body, res.body);
            notice = result;

            expect(result.addedItems).toEqual([]);
            expect(result.deletedItems).toEqual([]);
          } catch (e) {
            handleException(notice, e);
          }
        });
        test('unusal case: blank suffix', async () => {
          req.params.keyword = 'Test Title ';
          let notice;
          try {
            let res;
            let oldResult;

            [oldResult, res] = await Promise.all([
              getSearchItems('Test Title', authToken),
              getSearchItems(req.params.keyword, authToken),
            ]);

            notice = res;
            const result = ArraysChanges(oldResult.body, res.body);
            notice = result;

            expect(result.addedItems).toEqual([]);
            expect(result.deletedItems).toEqual([]);
          } catch (e) {
            handleException(notice, e);
          }
        });
      });
    });
  });

  describe('Patch /groups/:group_id/items/:item_id', () => {
    req.params.group_id = '1';
    req.params.item_id = '1';
    let moveItemRequest = { targetGroup_id: '2', targetItem_position: 1 };
    beforeEach(async () => {
      req.params.group_id = '1';
      req.params.item_id = '1';
      moveItemRequest = { targetGroup_id: '2', targetItem_position: 1 };
    });
    describe('401: JWT problem', () => {
      it('Missing JWT', async () => {
        let res;
        try {
          res = await validateApiResponse(patchItem, [req.params.group_id, req.params.item_id, moveItemRequest], 401, 'fail', 'Missing JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
      it('Invalid JWT', async () => {
        let res;
        try {
          res = await validateApiResponse(patchItem, [req.params.group_id, req.params.item_id, moveItemRequest, 123], 401, 'fail', 'Invalid JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
    });
    describe('400 Bad request: Body Format Error', () => {
      const itemTest = new BadRequestBodyTest(patchItem, userData, moveItemRequest);
      it('JSON Format Error', async () => {
        const invalidJson = '{ targetItem_position: }';
        await itemTest.jsonFormatError(invalidJson, [req.params.group_id, req.params.item_id]);
      });
      it('No field', async () => {
        await itemTest.noFieldError({}, authToken, 'Invalid request body', [req.params.group_id, req.params.item_id]);
      });
      it('Undefined Field', async () => {
        await itemTest.undefinedFieldError(authToken, 'not allowed', [req.params.group_id, req.params.item_id]);
      });
      // describe('Missing field', () => {
      //   itemTest.missingFieldError(authToken);
      // });
    });
    describe('400 Bad request: Field Data Format Error', () => {
      const itemTest = new BadRequestBodyTest(patchItem, userData, moveItemRequest);
      itemTest.fieldDataFormatError(authToken, [req.params.group_id, req.params.item_id]);
    });
    it('moveItem: returns 404 if source group not found', async () => {
      let res;
      try {
        req.params.group_id = '100'; // Non-existent group
        res = await validateApiResponse(patchItem, [req.params.group_id, req.params.item_id, moveItemRequest, authToken], 404, 'fail', 'Source group not found');
      } catch (e) {
        handleException(res, e);
      }
    });

    it('moveItem(toGroup): moves item from one group to another', async () => {
      let res;
      try {
        res = await validateApiResponse(patchItem, [req.params.group_id, req.params.item_id, moveItemRequest, authToken], 200, 'success', 'Item moved successfully');
      } catch (e) {
        handleException(res, e);
      }
    });
  });

  describe('Delete /groups/:group_id/items/:item_id', () => {
    beforeEach(() => {
      req.params.group_id = '2';
      req.params.item_id = '5';
    });
    describe('401: JWT problem', () => {
      it('Missing JWT', async () => {
        let res;
        try {
          res = await validateApiResponse(deleteItem, [req.params.group_id, req.params.item_id], 401, 'fail', 'Missing JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
      it('Invalid JWT', async () => {
        let res;
        try {
          res = await validateApiResponse(deleteItem, [req.params.group_id, req.params.item_id, 123], 401, 'fail', 'Invalid JWT');
        } catch (e) {
          handleException(res, e);
        }
      });
    });
    it('deleteItem: returns 404 if group not found', async () => {
      req.params.group_id = '3'; // Non-existent group
      let res;
      try {
        res = await validateApiResponse(deleteItem, [req.params.group_id, req.params.item_id, authToken], 404, 'fail', 'Group or item not found');
      } catch (e) {
        handleException(res, e);
      }
    });
    it('deleteItem: deletes item from group', async () => {
      let res;
      req.params.group_id = '11';
      req.params.item_id = '11';
      try {
        res = await validateApiResponse(deleteItem, [req.params.group_id, req.params.item_id, authToken], 204, null);
      } catch (e) {
        return handleException(res, e);
      }
    });
  });
};

module.exports = ItemTest;
