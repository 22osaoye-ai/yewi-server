import React from 'react';

export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn().mockReturnValue(true),
  setParams: jest.fn(),
};

export const mockSearchParams: Record<string, string> = {};

export const useRouter = () => mockRouter;

export const useLocalSearchParams = <T = any>(): T => mockSearchParams as unknown as T;

export const useSegments = () => ['(tabs)', 'index'];

export const usePathname = () => '/';

export const Link = ({ children, href, onPress, ...props }: any) =>
  React.createElement('a', { href, onClick: onPress, ...props }, children);

export default {
  useRouter,
  useLocalSearchParams,
  useSegments,
  usePathname,
  Link,
  router: mockRouter,
};
