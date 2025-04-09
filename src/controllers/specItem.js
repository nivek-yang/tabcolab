import { Tab, Note, Todo } from '../models/item.js';
import errorResponse from '../utils/errorResponse.js';

const addTab = async (req, res, next) => {
  try {
    const { group_id } = req.params;
    const { user_id } = req.user;

    const allowedFields = ['targetItem_position', 'browserTab_favIconURL', 'browserTab_title', 'browserTab_url', 'browserTab_id', 'browserTab_index', 'browserTab_active', 'browserTab_status', 'windowId'];
    const bodyKeys = Object.keys(req.body);

    // Check if all required keys are present in req.body and no extra fields in req.body
    const missingKeys = allowedFields.filter((key) => !bodyKeys.includes(key));
    const extraKeys = bodyKeys.filter((key) => !allowedFields.includes(key));

    if (missingKeys.length > 0) {
      return errorResponse(res, 400, `"${missingKeys[0]}" is required`);
    }

    if (extraKeys.length > 0) {
      return errorResponse(res, 400, `${extraKeys[0]} is not allowed in request body`);
    }

    const {
      targetItem_position,
      ...browserTabReq
    } = req.body;

    const browserTabData = {
      browserTab_favIconURL: browserTabReq.browserTab_favIconURL,
      browserTab_title: browserTabReq.browserTab_title,
      browserTab_url: browserTabReq.browserTab_url,
      browserTab_id: Number(browserTabReq.browserTab_id),
      browserTab_index: Number(browserTabReq.browserTab_index),
      browserTab_active: Boolean(browserTabReq.browserTab_active),
      browserTab_status: browserTabReq.browserTab_status,
      windowId: Number(browserTabReq.windowId),
    };

    const validValuesForAddTab = [targetItem_position, ...Object.values(browserTabData)];

    if (group_id && validValuesForAddTab.every((value) => value !== undefined)) {
      const newTab = new Tab(browserTabData);

      await newTab.addTab(user_id, group_id, targetItem_position);
      return res.status(201).json({ status: 'success', message: 'New tab added to group successfully', item_id: newTab.item_id });
    }
    return errorResponse(res, 400, 'Invalid request body');
  } catch (error) {
    next(error);
  }
};

const updateTab = async (req, res, next) => {
  try {
    const { group_id, item_id } = req.params;
    const { user_id } = req.user;
    const { note_content } = req.body;

    const updatedNoteContent = await Tab.updateTab(user_id, group_id, item_id, note_content);

    return res.status(201).json({ status: 'success', message: 'Note added to tab successfully', note_content: updatedNoteContent });
  } catch (error) {
    next(error);
  }
};

const addNote = async (req, res, next) => {
  try {
    const { group_id } = req.params;
    const { user_id } = req.user;

    const allowedFields = ['note_content', 'note_bgColor'];
    const bodyKeys = Object.keys(req.body);

    // Check if all required keys are present in req.body and no extra fields in req.body
    const missingKeys = allowedFields.filter((key) => !bodyKeys.includes(key));
    const extraKeys = bodyKeys.filter((key) => !allowedFields.includes(key));

    if (missingKeys.length > 0) {
      return errorResponse(res, 400, `"${missingKeys[0]}" is required`);
    }

    if (extraKeys.length > 0) {
      return errorResponse(res, 400, `${extraKeys[0]} is not allowed in request body`);
    }

    const { note_content, note_bgColor } = req.body;

    if (Object.keys(req.body).length > 2) {
      return errorResponse(res, 404, 'Unexpected Additional Parameters');
    }

    if (note_content === '') {
      return errorResponse(res, 404, '"note_content" is not allowed to be empty');
    }

    if (note_content === undefined && note_bgColor === undefined && Object.keys(req.body).length === 2) {
      return errorResponse(res, 404, 'Invalid request body');
    }

    if (group_id && note_content !== undefined && note_bgColor) {
      const newNote = new Note({ note_content, note_bgColor });

      await newNote.addNoteToGroup(group_id, user_id);
      return res.status(201).json({ status: 'success', message: 'Note added to group successfully', item_id: newNote.item_id });
    }
    return errorResponse(res, 400, 'Invalid request body');
  } catch (error) {
    next(error);
  }
};

const updateNote = async (req, res, next) => {
  try {
    const { group_id, item_id } = req.params;
    const { user_id } = req.user;
    const { item_type, note_content } = req.body;

    if (Object.keys(req.body).length === 0) {
      return errorResponse(res, 400, '"item_type" or "note_content" is required');
    }
    if (Object.keys(req.body).length > 1) {
      return errorResponse(res, 400, 'Unexpected Additional Parameters');
    }
    if (note_content === undefined && item_type !== 2) {
      return errorResponse(res, 400, 'Invaild Request Bodies, detail: Only change Note to Todo, item_type must be 2');
    }
    // modify note content
    if (group_id && note_content !== undefined) {
      await Note.updateNoteContent(user_id, group_id, item_id, note_content);
      return res.status(200).json({ status: 'success', message: 'Note content changed successfully' });
    }
    // change note to todo
    if (group_id && note_content === undefined && item_type === 2) {
      await Note.convertToTodo(user_id, group_id, item_id);
      return res.status(200).json({ status: 'success', message: 'Note changed to todo successfully' });
    }
    return res.status(400).json({ status: 'fail', message: 'Invalid request body' });
  } catch (error) {
    next(error);
  }
};

const updateTodo = async (req, res, next) => {
  try {
    const { group_id, item_id } = req.params;
    const { user_id } = req.user;
    const { item_type, doneStatus, note_content } = req.body;

    if (Object.keys(req.body).length === 0) {
      return errorResponse(res, 400, '"item_type" or "doneStatus" or "note_content" is required');
    }
    if (Object.keys(req.body).length > 1) {
      return errorResponse(res, 400, 'Unexpected Additional Parameters');
    }

    if (item_type === undefined && doneStatus === undefined && note_content === undefined) {
      return errorResponse(res, 400, 'Invalid request body');
    }

    if (item_type !== 1 && doneStatus === undefined && note_content === undefined) {
      return errorResponse(res, 400, 'Invalid Request Bodies, detail: Only change Todo to Note, item_type must be 1');
    }

    if (note_content !== undefined) {
      await Todo.updateTodo(user_id, group_id, item_id, item_type, doneStatus, note_content);
      return res.status(200).json({ status: 'success', message: 'Todo content changed successfully' });
    }

    if (item_type === 1) {
      await Todo.updateTodo(user_id, group_id, item_id, item_type, doneStatus, note_content);
      return res.status(200).json({ status: 'success', message: 'Todo changed to Note successfully' });
    }

    if (doneStatus === true || doneStatus === false) {
      await Todo.updateTodo(user_id, group_id, item_id, item_type, doneStatus, note_content);
      return res.status(200).json({ status: 'success', message: 'Todo status updated successfully' });
    }
    return errorResponse(res, 400, 'Invalid request body');
  } catch (error) {
    next(error);
  }
};

export {
  addTab,
  updateTab,
  addNote,
  updateNote,
  updateTodo,
};
