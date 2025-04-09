import mongoose from 'mongoose';
import { generateGroupId } from '../utils/generateId.js';
import AppError from '../utils/appError.js';

const { Schema } = mongoose;

const GroupSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: generateGroupId,
    alias: 'group_id',
  },
  group_icon: {
    type: String,
    default: 'default_icon',
  },
  group_title: {
    type: String,
    default: 'Untitled',
  },
  items: {
    type: [Schema.Types.Mixed],
    default: [],
  },
}, {
  toJSON: {
    transform(doc, ret) {
      const { _id, ...rest } = ret;
      const newRet = { group_id: _id, ...rest };
      if (newRet.items) {
        newRet.items = newRet.items.map((item) => {
          const { _id, id, ...itemRest } = item;
          return { item_id: _id, ...itemRest };
        });
      }
      return newRet;
    },
  },
});

const UserGroupSchema = new mongoose.Schema({
  _id: {
    type: String,
    alias: 'user_id',
  },
  groups: [GroupSchema],
}, {
  toJSON: {
    transform(doc, ret) {
      const { _id, ...rest } = ret;
      const newRet = { user_id: _id, ...rest };
      return newRet;
    },
  },
});

UserGroupSchema.statics.findGroupById = async function findGroupById(user_id, group_id) {
  const userGroup = await this.findOne({ _id: user_id }).exec();
  if (!userGroup) {
    throw new AppError(404, 'User not found or invalid user ID');
  }
  const group = userGroup.groups.find((group) => group._id === group_id);
  if (!group) {
    throw new AppError(404, 'Group not found or invalid group ID');
  }
  return group;
};

UserGroupSchema.statics.getGroups = async function getGroups(user_id) {
  const userGroup = await this.findOne({ _id: user_id }).exec();
  if (!userGroup) {
    throw new AppError(404, 'No user group model in database');
  }
  const { groups } = userGroup;
  if (groups.length > 0) {
    return { success: true, message: 'Groups got successfully', groups };
  }
  return { success: false, message: 'No groups found for the user' };
};

UserGroupSchema.statics.findGroupItem = async function findGroupItem(user_id, group_id, item_id) {
  const sourceGroup = await this.model('UserGroup').findGroupById(user_id, group_id);

  if (!sourceGroup.items) {
    throw new AppError(404, 'Target group does not contain items');
  }

  const itemIndex = sourceGroup.items.findIndex((item) => item._id === item_id);
  if (itemIndex === -1) {
    throw new AppError(404, 'Item not found in source group');
  }

  const sourceGroupItem = sourceGroup.items[itemIndex];

  return { sourceGroupItem, itemIndex };
};

UserGroupSchema.statics.deleteGroupItem = async function deleteGroupItem(user_id, group_id, item_id) {
  const userGroup = await this.findOne({ _id: user_id }).exec();
  if (!userGroup) {
    throw new AppError(404, 'User not found or invalid user ID');
  }

  const { itemIndex } = await this.model('UserGroup').findGroupItem(user_id, group_id, item_id);

  // Find the group
  const group = userGroup.groups.find((group) => group._id === group_id);
  if (!group) {
    throw new AppError(404, 'Group not found or invalid group ID');
  }

  // Remove the item from the group
  group.items.splice(itemIndex, 1);

  // Save the updated userGroup document
  await userGroup.save();

  return { success: true, message: 'Item deleted successfully' };
};

UserGroupSchema.methods.createGroup = async function createGroup(user_id) {
  // Check if the userGroups document already exists
  let userGroup = await this.model('UserGroup').findOne({ _id: user_id });

  // If not, create a new one
  if (!userGroup) {
    userGroup = new this.model('UserGroup')({ _id: user_id, groups: [] });
  }

  // If the groups field does not exist, initialize it
  if (!userGroup.groups) {
    userGroup.groups = [];
  }

  // Add the new group to the groups array
  userGroup.groups = userGroup.groups.concat(this.groups);

  // Save the updated UserGroup document
  await userGroup.save();

  return { success: true, message: 'Group created successfully' };
};

UserGroupSchema.methods.createGroupatBlank = async function createGroupatBlank(user_id) {
  await this.createGroup(user_id);
  return { success: true, message: 'Group created at blank successfully' };
};

UserGroupSchema.methods.createGroupwithSidebarTab = async function createGroupwithSidebarTab(user_id) {
  await this.createGroup(user_id);
  return { success: true, message: 'Group created with sidebar tab successfully' };
};

UserGroupSchema.methods.createGroupwithGroupTab = async function createGroupwithGroupTab(user_id, sourceGroup_id, item_id) {
  await this.createGroup(user_id);
  await this.model('UserGroup').deleteGroupItem(user_id, sourceGroup_id, item_id);
  return { success: true, message: 'Group created with group tab successfully' };
};

UserGroupSchema.statics.updateGroupInfo = async function updateGroupInfo(user_id, group) {
  // Find the UserGroup document
  const userGroup = await this.findOne({ _id: user_id });

  // Find the group to update
  const groupToUpdate = userGroup.groups.id(group._id);

  // Update the group
  if (groupToUpdate) {
    groupToUpdate.set(group);
  }

  // Save the updated UserGroup document
  await userGroup.save();

  return { success: true, message: 'Group info updated successfully' };
};

UserGroupSchema.statics.changeGroupPosition = async function changeGroupPosition(user_id, group_id, group_pos) {
  // Find the UserGroup document
  const userGroup = await this.findOne({ _id: user_id });

  // Find the index of the group to move
  const groupIndex = userGroup.groups.findIndex((group) => group._id.toString() === group_id);

  if (groupIndex !== -1 && group_pos >= 0 && group_pos < userGroup.groups.length) {
    // Remove the group from its current position
    const movedGroup = userGroup.groups.splice(groupIndex, 1)[0];

    // Insert the group at the new position
    userGroup.groups.splice(group_pos, 0, movedGroup);

    // Save the updated UserGroup document
    await userGroup.save();

    return { success: true, message: 'Group position updated successfully' };
  }
  throw new AppError(400, 'Invalid group ID or position');
};

UserGroupSchema.statics.deleteGroup = async function deleteGroup(user_id, group_id) {
  // Find the UserGroup document
  const userGroup = await this.findOne({ _id: user_id });

  // Check if the group exists
  const groupExists = userGroup.groups.some((group) => group._id.toString() === group_id);

  // Delete the group
  if (groupExists) {
    userGroup.groups.pull(group_id);
    await userGroup.save();
    return { success: true, message: 'Group deleted successfully' };
  }
  throw new AppError(404, 'Group not found');
};

const Group = mongoose.model('Group', GroupSchema);
const UserGroup = mongoose.model('UserGroup', UserGroupSchema);

export { Group, UserGroup };
