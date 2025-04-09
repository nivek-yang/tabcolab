import mongoose from 'mongoose';
import { UserGroup } from './group.js';
import { generateItemId } from '../utils/generateId.js';
import AppError from '../utils/appError.js';

// 定義並導出 Schema
export const ItemSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: generateItemId,
    alias: 'item_id',
  },
  item_type: Number,
  note_bgColor: String,
}, {
  toJSON: {
    transform(doc, ret) {
      const { _id, ...rest } = ret;
      const newRet = { item_id: _id, ...rest };
      return newRet;
    },
  },
});

ItemSchema.statics.getItemById = async function getItemById(group_id, item_id, user_id) {
  const { sourceGroupItem } = await UserGroup.findGroupItem(user_id, group_id, item_id);
  return sourceGroupItem;
};

ItemSchema.statics.searchItemsInGroups = async function searchItemsInGroups(keyword, itemTypeOptions, user_id) {
  const userGroup = await UserGroup.findOne({ _id: user_id }).exec();
  const { groups } = userGroup;

  if (!Array.isArray(groups)) return [];

  if (keyword === '') {
    return [];
  }
  let keywords;
  keywords = [...new Set(keyword.trim().split(/\s+/))].filter((item) => item !== '');
  if (keywords.length === 0) { keywords = ['']; }// 如果結果是單純得[""]就保留，即實現空白搜尋全部

  const regexes = keywords.map((currentKeyword) => new RegExp(`${currentKeyword}`, 'i'));

  const matchingItems = [];
  const seenItems = {};

  groups.forEach((group) => {
    group.items.forEach((item) => {
      if (!itemTypeOptions.includes(item.item_type)) return;

      const { browserTab_title, browserTab_url, note_content } = item;

      const matchesKeyword = regexes.some((regex) => {
        const matchTitle = regex.test(browserTab_title) && browserTab_title !== undefined;
        // const matchUrl = regex.test(browserTab_url) && browserTab_url !== undefined;
        // const matchNote = regex.test(note_content) && note_content !== undefined;

        return matchTitle; // || matchUrl || matchNote;
      });

      if (matchesKeyword) {
        const key = `${group._id}_${item._id}`;
        if (!seenItems[key]) {
          const { _id, id, ...rest } = item; // 解構出 _id 和 id
          matchingItems.push({
            group_id: group.group_id,
            item_id: _id, // 將 _id 轉換為 item_id
            ...rest, // 展開剩餘的屬性
          });
          seenItems[key] = true;
        }
      }
    });
  });

  return matchingItems;
};

ItemSchema.statics.moveItem = async function moveItem(sourceGroupId, targetGroupId, itemId, newPosition, user_id) {
  const userGroup = await UserGroup.findOne({ _id: user_id }).exec();
  const sourceGroup = userGroup.groups.find((group) => group._id === sourceGroupId);
  const targetGroup = userGroup.groups.find((group) => group._id === targetGroupId);

  if (!sourceGroup) {
    throw new AppError(404, 'Source group not found');
  }

  if (!targetGroup) {
    throw new AppError(404, 'Target group not found');
  }

  const itemToMove = sourceGroup.items.find((item) => item._id === itemId);

  if (!itemToMove) {
    return { success: false, error: 'Item not found in source group' };
  }

  // if (!targetGroup) {
  //   targetGroup = sourceGroup;
  // }

  const sourceIndex = sourceGroup.items.indexOf(itemToMove);
  sourceGroup.items.splice(sourceIndex, 1);

  let adjustedPosition = newPosition; // Create a new variable to hold the adjusted value

  if (newPosition !== undefined) {
    if (newPosition > targetGroup.items.length) {
      adjustedPosition = targetGroup.items.length;
    } else if (newPosition < 0) {
      adjustedPosition = 0;
    }
    targetGroup.items.splice(adjustedPosition, 0, itemToMove);
  } else {
    targetGroup.items.push(itemToMove);
  }

  await userGroup.save();
  return { success: true, message: 'Item moved successfully' };
};

ItemSchema.statics.deleteItem = async function deleteItem(groupId, itemId, user_id) {
  const userGroup = await UserGroup.findOne({ _id: user_id }).exec();
  const group = userGroup.groups.find((group) => group._id === groupId);

  if (!group) {
    return null; // 如果找不到該群組，返回null
  }
  const index = group.items.findIndex((item) => item._id === itemId);
  if (index === -1) {
    return null; // 如果在群組中找不到該項目，返回null
  }
  group.items.splice(index, 1); // 從群組中刪除該項目
  await userGroup.save(); // 將更改寫回到資料庫
  return group; // 返回已刪除項目的群組對象
};

const TabSchema = new mongoose.Schema({
  ...ItemSchema.obj, // 繼承 ItemSchema 的屬性
  item_type: {
    type: Number,
    default: 0,
  },
  browserTab_favIconURL: String,
  browserTab_title: String,
  browserTab_url: String,
  browserTab_id: Number,
  browserTab_index: Number,
  browserTab_active: Boolean,
  browserTab_status: String,
  windowId: Number,
  note_content: {
    type: String,
    default: '',
  },
});

TabSchema.methods.addTab = async function addTab(user_id, group_id, targetItem_position) {
  const userGroup = await UserGroup.findOne({ _id: user_id }).exec();
  const group = userGroup.groups.find((group) => group._id === group_id);

  if (!group) {
    throw new AppError(404, 'Group not found or invalid group ID');
  }
  // 確保 targetItem_position 在有效範圍內
  if (targetItem_position >= 0 && targetItem_position <= group.items.length) {
    // 使用 splice 在指定位置插入 newTab
    group.items.splice(targetItem_position, 0, this);
  } else {
    // 如果目標位置超出陣列範圍，則預設在陣列末尾插入 newTab
    group.items.push(this);
  }

  await userGroup.save();
};

TabSchema.statics.updateTab = async function updateTab(user_id, group_id, item_id, note_content) {
  const userGroup = await UserGroup.findOne({ _id: user_id }).exec();
  const group = userGroup.groups.find((group) => group._id === group_id);

  if (!group) {
    throw new AppError(404, 'Group not found or invalid group ID');
  }

  const tab = group.items.find((item) => item._id === item_id && item.item_type === 0);

  if (!tab) {
    throw new AppError(404, 'Tab not found in group');
  }

  tab.note_content = String(note_content);

  await userGroup.markModified('groups'); // 告訴 Mongoose groups 欄位已被修改
  await userGroup.save();

  return tab.note_content;
};

const NoteSchema = new mongoose.Schema({
  ...ItemSchema.obj,
  item_type: {
    type: Number,
    default: 1,
  },
  note_content: {
    type: String,
    required: true,
  },
  note_bgColor: {
    type: String,
    default: '#ffffff',
  },
});

NoteSchema.methods.addNoteToGroup = async function addNoteToGroup(group_id, user_id) {
  const userGroup = await UserGroup.findOne({ _id: user_id }).exec();
  const group = userGroup.groups.find((group) => group._id === group_id);

  if (!group) {
    throw new AppError(404, 'Group not found or invalid group ID');
  }
  group.items.push(this);

  await userGroup.save();
};

NoteSchema.statics.updateNoteContent = async function updateNoteContent(user_id, group_id, item_id, newContent) {
  const userGroup = await UserGroup.findOne({ _id: user_id }).exec();
  const group = userGroup.groups.find((group) => group._id === group_id);

  if (!group) {
    throw new AppError(404, 'Group not found or invalid group ID');
  }

  const noteIndex = group.items.findIndex((item) => item._id === item_id && item.item_type === 1);
  if (noteIndex === -1) {
    throw new AppError(404, 'Note not found in group');
  }

  group.items[noteIndex].note_content = newContent;

  await userGroup.markModified('groups'); // 告訴 Mongoose groups 欄位已被修改
  await userGroup.save();
};

NoteSchema.statics.convertToTodo = async function convertToTodo(user_id, group_id, item_id) {
  const user_groups = await UserGroup.findOne({ _id: user_id }).exec();
  const group = user_groups.groups.find((group) => group._id === group_id);

  if (!group) {
    throw new AppError(404, 'Group not found or invalid group ID');
  }

  const noteIndex = group.items.findIndex((item) => item._id === item_id && item.item_type === 1);
  if (noteIndex === -1) {
    throw new AppError(404, 'Note not found in group');
  }

  group.items[noteIndex].item_type = 2;
  group.items[noteIndex].doneStatus = false;

  await user_groups.markModified('groups'); // 告訴 Mongoose groups 欄位已被修改
  await user_groups.save();
};

const TodoSchema = new mongoose.Schema({
  ...ItemSchema.obj,
  item_type: {
    type: Number,
    default: 2,
  },
  note_content: {
    type: String,
    required: true,
  },
  note_bgColor: {
    type: String,
    default: '#ffffff',
  },
  doneStatus: {
    type: Boolean,
    default: false,
  },
});

TodoSchema.statics.updateTodo = async function updateTodo(user_id, group_id, item_id, item_type, doneStatus, note_content) {
  const userGroup = await UserGroup.findOne({ _id: user_id }).exec();
  const group = userGroup.groups.find((group) => group._id === group_id);

  if (!group) {
    throw new AppError(404, 'Group not found or invalid group ID');
  }

  const todoIndex = group.items.findIndex((item) => item._id === item_id && item.item_type === 2);
  if (todoIndex === -1) {
    throw new AppError(404, 'Todo not found in group');
  }
  // 更新 todo 的 note_content
  if (group && todoIndex !== undefined && note_content !== undefined) {
    group.items[todoIndex].note_content = note_content;
  }
  // 把 todo 轉成 note
  if (group && todoIndex !== undefined && item_type === 1) {
    group.items[todoIndex].item_type = 1;
    delete group.items[todoIndex].doneStatus;
  }
  // 更新 todo 的 doneStatus
  if (group && todoIndex !== undefined && (doneStatus === true || doneStatus === false)) {
    group.items[todoIndex].doneStatus = doneStatus;
  }
  await userGroup.markModified('groups'); // 告訴 Mongoose groups 欄位已被修改
  await userGroup.save();
};

// 定義並導出模型
export const Item = mongoose.model('Item', ItemSchema);
export const Tab = mongoose.model('Tab', TabSchema);
export const Note = mongoose.model('Note', NoteSchema);
export const Todo = mongoose.model('Todo', TodoSchema);
