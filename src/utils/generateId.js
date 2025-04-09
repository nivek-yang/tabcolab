import { v4 as uuidv4 } from 'uuid';

export function generateGroupId() {
  return uuidv4();
}

export function generateItemId() {
  return uuidv4();
}

export function generateUserId() {
  return uuidv4();
}
