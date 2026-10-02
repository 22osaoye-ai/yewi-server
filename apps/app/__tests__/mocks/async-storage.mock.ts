const storage: Record<string, string> = {};

export const AsyncStorage = {
  getItem: jest.fn((key: string) => Promise.resolve(storage[key] || null)),
  setItem: jest.fn((key: string, val: string) => {
    storage[key] = val;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete storage[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
    return Promise.resolve();
  }),
};

export default AsyncStorage;
