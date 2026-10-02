const secureStorage: Record<string, string> = {};

export const getItemAsync = jest.fn((key: string) => Promise.resolve(secureStorage[key] || null));
export const setItemAsync = jest.fn((key: string, val: string) => {
  secureStorage[key] = val;
  return Promise.resolve();
});
export const deleteItemAsync = jest.fn((key: string) => {
  delete secureStorage[key];
  return Promise.resolve();
});
export const isAvailableAsync = jest.fn(() => Promise.resolve(true));

export const WHEN_UNLOCKED = 'WHEN_UNLOCKED';
export const AFTER_FIRST_UNLOCK = 'AFTER_FIRST_UNLOCK';
export const ALWAYS = 'ALWAYS';
export const WHEN_PASSCODE_SET_THIS_DEVICE_ONLY = 'WHEN_PASSCODE_SET_THIS_DEVICE_ONLY';

export default {
  getItemAsync,
  setItemAsync,
  deleteItemAsync,
  isAvailableAsync,
  WHEN_UNLOCKED,
  AFTER_FIRST_UNLOCK,
  ALWAYS,
  WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
};
