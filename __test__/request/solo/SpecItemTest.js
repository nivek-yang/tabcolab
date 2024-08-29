const request = require('supertest');
const { handleException } = require('../../utils/testErrorHandler');
const { validateApiResponse } = require('../../utils/apiTestHelper');
const { BadRequestBodyTest } = require('../../classes/BadRequestBodyTest');

const SpecItemTest = async (server) => {
  let authToken;
  let userData = { email: 'user@example.com', password: 'mySecurePassword123' };
  beforeAll(async () => {
    userData = { email: 'user@example.com', password: 'mySecurePassword123' };
    const res = await request(server)
      .post('/api/1.0/users/login')
      .send(userData);
    authToken = res.body.token;
  });

  const {
    postTab, postNote, patchNote, patchTodo,
  } = require('../apis/specItemAPI');

  let req = { params: {}, body: {} };

  beforeEach(() => {
    req = { params: {}, body: {} };
  });

  describe('Tab API Endpoints', () => {
    beforeEach(async () => {
      req.params.group_id = '1';
    });

    // Test case for addTab endpoint
    describe('POST /groups/:group_id/tabs', () => {
      let newTabData = {
        browserTab_favIconURL: 'http://example.com/favicon.ico',
        browserTab_title: 'Test Tab',
        browserTab_url: 'http://example.com',
        browserTab_id: 456,
        browserTab_index: 7,
        browserTab_active: false,
        browserTab_status: 'complete',
        windowId: 8438513405,
        targetItem_position: 0,
      };
      beforeEach(() => {
        newTabData = {
          browserTab_favIconURL: 'http://example.com/favicon.ico',
          browserTab_title: 'Test Tab',
          browserTab_url: 'http://example.com',
          browserTab_id: 456,
          browserTab_index: 7,
          browserTab_active: false,
          browserTab_status: 'complete',
          windowId: 8438513405,
          targetItem_position: 0,
        };
      });
      describe('401: JWT problem', () => {
        it('Missing JWT', async () => {
          let res;
          try {
            res = await validateApiResponse(postTab, [req.params.group_id, newTabData], 401, 'fail', 'Missing JWT');
          } catch (e) {
            handleException(res, e);
          }
        });
        it('Invalid JWT', async () => {
          let res;
          try {
            res = await validateApiResponse(postTab, [req.params.group_id, newTabData, 123], 401, 'fail', 'Invalid JWT');
          } catch (e) {
            handleException(res, e);
          }
        });
      });
      describe('400 Bad request: Body Format Error', () => {
        const specItemTest = new BadRequestBodyTest(postTab, userData, newTabData);
        it('JSON Format Error', async () => {
          const invalidJson = '{ browserTab_favIconURL: }';
          await specItemTest.jsonFormatError(invalidJson, [req.params.group_id]);
        });
        it('No field', async () => {
          await specItemTest.noFieldError({}, authToken, 'is required', [req.params.group_id]);
        });
        it('Undefined Field', async () => {
          await specItemTest.undefinedFieldError(authToken, 'not allowed', [req.params.group_id]);
        });
        describe('Missing field', () => {
          specItemTest.missingFieldError(authToken, [req.params.group_id]);
        });
      });
      describe('400 Bad request: Field Data Format Error', () => {
        const specItemTest = new BadRequestBodyTest(postTab, userData, newTabData);
        specItemTest.fieldDataFormatError(authToken, [req.params.group_id]);
      });
      it('addTab: should respond with 201 and return item_id when valid data is provided', async () => {
        let res;
        try {
          res = await validateApiResponse(postTab, [req.params.group_id, newTabData, authToken], 201, 'success', 'New tab added to group successfully');
          expect(res.body).toHaveProperty('item_id');
        } catch (e) {
          handleException(res, e);
        }
      });

      test('addTab: should respond with 404 when invalid group_id', async () => {
        req.params.group_id = '100';
        let res;
        try {
          res = await validateApiResponse(postTab, [req.params.group_id, newTabData, authToken], 404, 'fail', 'Group not found or invalid group ID');
        } catch (e) {
          handleException(res, e);
        }
      });
    });

    //   // Test case for updateTab endpoint
    //   describe('PATCH /groups/:group_id/tabs/:item_id', () => {
    //     beforeEach(async () => {
    //       req.params.group_id = '1';
    //       req.params.item_id = '1';
    //     });

    //     test('updateTab: should respond with 201 and update note when valid data is provided', async () => {
    //       // Send a request to update an existing tab
    //       //   const res =

    //       const res = await request(server)
    //         .patch(`/groups/${req.params.group_id}/tabs/${req.params.item_id}`)
    //         .send({
    //           note_content: 'Updated note content',
    //           // note_bgColor: '#ffffff',
    //         });

    //       expect(res.status).toBe(201);
    //       expect(res.body).toHaveProperty('message', 'Note added to tab successfully');
    //       expect(res.body).toHaveProperty('note_content', 'Updated note content');
    //     });

    //     test('updateTab: should respond with 400 when invalid data is provided', async () => {
    //       //   const res =
    //       req.params.item_id = '2';
    //       const res = await request(server)
    //         .patch(`/groups/${req.params.group_id}/tabs/${req.params.item_id}`)
    //         .send({
    //           // Invalid data, missing required fields
    //         });

    //       expect(res.status).toBe(404);
    //       expect(res.body).toHaveProperty('error', 'Tab not found in group');
    //     });

    //     // Add more test cases as needed
    //   });

    //   // Add more test cases for other endpoints like addNote, updateNote, etc.
    // });

    describe('Note API Endpoints', () => {
      beforeEach(async () => {
        req.params.group_id = '1';
      });

      describe('Post /groups/:group_id/notes', () => {
        let newNoteData = {
          note_content: 'note',
          note_bgColor: '#ffffff',
        };

        beforeEach(() => {
          req.params.group_id = '1';
        });
        beforeEach(() => {
          newNoteData = {
            note_content: 'note',
            note_bgColor: '#ffffff',
          };
        });
        describe('401: JWT problem', () => {
          it('Missing JWT', async () => {
            let res;
            try {
              res = await validateApiResponse(postNote, [req.params.group_id, newNoteData], 401, 'fail', 'Missing JWT');
            } catch (e) {
              handleException(res, e);
            }
          });
          it('Invalid JWT', async () => {
            let res;
            try {
              res = await validateApiResponse(postNote, [req.params.group_id, newNoteData, 123], 401, 'fail', 'Invalid JWT');
            } catch (e) {
              handleException(res, e);
            }
          });
        });
        describe('400 Bad request: Body Format Error', () => {
          const specItemTest = new BadRequestBodyTest(postNote, userData, newNoteData);
          it('JSON Format Error', async () => {
            const invalidJson = '{ note_content: }';
            await specItemTest.jsonFormatError(invalidJson, [req.params.group_id]);
          });
          it('No field', async () => {
            await specItemTest.noFieldError({}, authToken, 'is required', [req.params.group_id]);
          });
          it('Undefined Field', async () => {
            await specItemTest.undefinedFieldError(authToken, 'not allowed', [req.params.group_id]);
          });
          describe('Missing field', () => {
            specItemTest.missingFieldError(authToken, [req.params.group_id]);
          });
        });
        describe('400 Bad request: Field Data Format Error', () => {
          const specItemTest = new BadRequestBodyTest(postNote, userData, newNoteData);
          specItemTest.fieldDataFormatError(authToken, [req.params.group_id]);
        });
        it('postNote: should respond with status 404 if group is not found', async () => {
          req.params.group_id = '9';
          let res;
          try {
            res = await validateApiResponse(postNote, [req.params.group_id, newNoteData, authToken], 404, 'fail', 'Group not found or invalid group ID');
          } catch (e) {
            handleException(res, e);
          }
        });

        it('addNote: should add a note to group successfully', async () => {
          let res;
          try {
            res = await validateApiResponse(postNote, [req.params.group_id, newNoteData, authToken], 201, 'success', 'Note added to group successfully');
            expect(res.body).toHaveProperty('item_id');
          } catch (e) {
            handleException(res, e);
          }
        });
      });

      describe('Patch /groups/:group_id/notes/:item_id', () => {
        let patchNoteRequest;
        beforeEach(async () => {
          req.params.group_id = '1';
          req.params.item_id = '2';
        });
        describe('404', () => {
          it('updateNote: should respond with status 404 if group is not found', async () => {
            req.params.group_id = '9';
            patchNoteRequest = { item_type: 2 };
            let res;
            try {
              res = await validateApiResponse(patchNote, [req.params.group_id, req.params.item_id, patchNoteRequest, authToken], 404, 'fail', 'Group not found or invalid group ID');
            } catch (e) {
              handleException(res, e);
            }
          });
          it('updateNote: should respond with status 404 if note is not found in group', async () => {
            req.params.item_id = '100';
            patchNoteRequest = { note_content: '404' };
            let res;
            try {
              res = await validateApiResponse(patchNote, [req.params.group_id, req.params.item_id, patchNoteRequest, authToken], 404, 'fail', 'Note not found in group');
            } catch (e) {
              handleException(res, e);
            }
          });
        });
        describe('PATCH Note Content', () => {
          patchNoteRequest = {
            note_content: 'changed_note_content', // Assuming 1 represents a note
          };
          beforeEach(async () => {
            patchNoteRequest = {
              note_content: 'changed_note_content', // Assuming 1 represents a note
            };
          });

          describe('400 Bad request: Field Data Format Error', () => {
            const specItemTest = new BadRequestBodyTest(patchNote, userData, patchNoteRequest);
            specItemTest.fieldDataFormatError(authToken, [req.params.group_id, req.params.item_id]);
          });

          it('updateNote: should change note content successfully', async () => {
            let res;
            try {
              res = await validateApiResponse(patchNote, [req.params.group_id, req.params.item_id, patchNoteRequest, authToken], 200, 'success', 'Note content changed successfully');
            } catch (e) {
              handleException(res, e);
            }
          });
        });
        describe('PATCH Item Type to Todo', () => {
          patchNoteRequest = {
            item_type: 2, // Assuming 1 represents a note
          };

          beforeEach(async () => {
            patchNoteRequest = {
              item_type: 2, // Assuming 1 represents a note
            };
          });
          describe('400 Bad request: Field Data Format Error', () => {
            const specItemTest = new BadRequestBodyTest(patchNote, userData, patchNoteRequest);
            specItemTest.fieldDataFormatError(authToken, [req.params.group_id, req.params.item_id], '"item_type" must be one of [0, 1, 2]');
          });
          it('updateNote: should change note to todo successfully', async () => {
            let res;
            try {
              res = await validateApiResponse(patchNote, [req.params.group_id, req.params.item_id, patchNoteRequest, authToken], 200, 'success', 'Note changed to todo successfully');
            } catch (e) {
              handleException(res, e);
            }
          });
        });
        describe('400 Bad request: Body Format Error', () => {
          const specItemTest = new BadRequestBodyTest(patchNote, userData, patchNoteRequest);
          it('JSON Format Error', async () => {
            const invalidJson = '{ item_type: }';
            await specItemTest.jsonFormatError(invalidJson, [req.params.group_id, req.params.item_id]);
          });
          it('No field', async () => {
            await specItemTest.noFieldError({}, authToken, 'is required', [req.params.group_id, req.params.item_id]);
          });
          it('Undefined Field', async () => {
            await specItemTest.undefinedFieldError(authToken, 'Unexpected Additional Parameters', [req.params.group_id, req.params.item_id]);
          });
          // describe('Missing field', () => {
          //   specItemTest.missingFieldError(authToken, [req.params.group_id, req.params.item_id]);
          // });
        });
      });
    });
    describe('Todo API Endpoints', () => {
      let patchTodoRequest;
      describe('Patch /groups/:group_id/todos/:item_id', () => {
        beforeEach(async () => {
          req.params.group_id = '1';
          req.params.item_id = '3';
        });
        describe('401: JWT problem', () => {
          patchTodoRequest = { item_type: 1 };
          it('Missing JWT', async () => {
            let res;
            try {
              res = await validateApiResponse(postNote, [req.params.group_id, patchTodoRequest], 401, 'fail', 'Missing JWT');
            } catch (e) {
              handleException(res, e);
            }
          });
          it('Invalid JWT', async () => {
            let res;
            try {
              res = await validateApiResponse(patchTodo, [req.params.group_id, req.params.item_id, patchTodoRequest, 123], 401, 'fail', 'Invalid JWT');
            } catch (e) {
              handleException(res, e);
            }
          });
        });

        describe('404', () => {
          it('updateTodo: should respond with status 404 if group is not found', async () => {
            req.params.group_id = '9';
            patchTodoRequest = { item_type: 1 };
            let res;
            try {
              res = await validateApiResponse(patchTodo, [req.params.group_id, req.params.item_id, patchTodoRequest, authToken], 404, 'fail', 'Group not found or invalid group ID');
            } catch (e) {
              handleException(res, e);
            }
          });
          it('updateTodo: should respond with status 404 if todo is not found in group', async () => {
            req.params.item_id = '100';
            patchTodoRequest = { item_type: 1 };
            let res;
            try {
              res = await validateApiResponse(patchTodo, [req.params.group_id, req.params.item_id, patchTodoRequest, authToken], 404, 'fail', 'Todo not found in group');
            } catch (e) {
              handleException(res, e);
            }
          });
        });
        describe('PATCH Done status', () => {
          req.params.group_id = '1';
          req.params.item_id = '2';
          patchTodoRequest = { doneStatus: true };

          beforeEach(async () => {
            req.params.group_id = '1';
            req.params.item_id = '2';
            patchTodoRequest = { doneStatus: true };
          });
          describe('400 Bad request: Field Data Format Error', () => {
            const specItemTest = new BadRequestBodyTest(patchTodo, userData, patchTodoRequest);
            specItemTest.fieldDataFormatError(authToken, [req.params.group_id, req.params.item_id]);
          });
          it('updateTodo(StatusUpdate): should update todo status successfully', async () => {
            let res;
            try {
              res = await validateApiResponse(patchTodo, [req.params.group_id, req.params.item_id, patchTodoRequest, authToken], 200, 'success', 'Todo status updated successfully');
            } catch (e) {
              handleException(res, e);
            }
          });
        });
        describe('PATCH Item Type to Note', () => {
          patchTodoRequest = { item_type: 1 };
          beforeEach(async () => {
            patchTodoRequest = { item_type: 1 };
          });

          describe('400 Bad request: Field Data Format Error', () => {
            const specItemTest = new BadRequestBodyTest(patchTodo, userData, patchTodoRequest);
            specItemTest.fieldDataFormatError(authToken, [req.params.group_id, req.params.item_id], '"item_type" must be one of [0, 1, 2]');
          });
          it('updateTodo(ChangetoNote): should change todo to note successfully', async () => {
            let res;
            try {
              res = await validateApiResponse(patchTodo, [req.params.group_id, req.params.item_id, patchTodoRequest, authToken], 200, 'success', 'Todo changed to Note successfully');
            } catch (e) {
              handleException(res, e);
            }
          });
          test('updateTodo(ChangetoNote): should update todo status agian successfully', async () => {
            req.params.group_id = '1';
            req.params.item_id = '2';
            patchTodoRequest = { doneStatus: false };
            let res;
            try {
              res = await validateApiResponse(patchTodo, [req.params.group_id, req.params.item_id, patchTodoRequest, authToken], 200, 'success', 'Todo status updated successfully');
            } catch (e) {
              handleException(res, e);
            }
          });
        });
        describe('PATCH Note Content', () => {
          req.params.group_id = '1';
          req.params.item_id = '2';
          patchTodoRequest = { note_content: 'changed_note_content' };
          beforeEach(async () => {
            req.params.group_id = '1';
            req.params.item_id = '2';
            patchTodoRequest = { note_content: 'changed_note_content' };
          });
          describe('400 Bad request: Field Data Format Error', () => {
            const specItemTest = new BadRequestBodyTest(patchTodo, userData, patchTodoRequest);
            specItemTest.fieldDataFormatError(authToken, [req.params.group_id, req.params.item_id]);
          });

          it('updateTodo(ChangeContent): should update note content successfully', async () => {
            let res;
            try {
              res = await validateApiResponse(patchTodo, [req.params.group_id, req.params.item_id, patchTodoRequest, authToken], 200, 'success', 'Todo content changed successfully');
            } catch (e) {
              handleException(res, e);
            }
          });
        });
        describe('400 Bad request: Body Format Error', () => {
          const specItemTest = new BadRequestBodyTest(patchTodo, userData, patchTodoRequest);
          it('JSON Format Error', async () => {
            const invalidJson = '{ note_content: }';
            await specItemTest.jsonFormatError(invalidJson, [req.params.group_id, req.params.item_id]);
          });
          it('No field', async () => {
            await specItemTest.noFieldError({}, authToken, '"item_type" or "doneStatus" or "note_content" is required', [req.params.group_id, req.params.item_id]);
          });
          it('Undefined Field', async () => {
            await specItemTest.undefinedFieldError(authToken, 'Unexpected Additional Parameters', [req.params.group_id, req.params.item_id]);
          });
          // describe('Missing field', () => {
          //   specItemTest.missingFieldError(authToken, [req.params.group_id, req.params.item_id]);
          // });
        });

        // test('updateTodo: should respond with status 400 if request body is invalid', async () => {
        //   patchTodoRequest = { };
        //   let notice;
        //   try {
        //     const res = await patchTodo(req.params.group_id, req.params.item_id, patchTodoRequest, authToken);
        //     notice = res;
        //     expect(res.status).toBe(400);
        //     expect(res.body).toEqual({ error: 'Invalid request body' });
        //   } catch (e) {
        //     handleException(notice, e);
        //   }
        // });
      });
    });
  });
};

module.exports = SpecItemTest;
