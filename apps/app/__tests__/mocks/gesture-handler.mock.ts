import React from 'react';

export const GestureHandlerRootView = ({ children, ...props }: any) =>
  React.createElement('div', props, children);

export const GestureDetector = ({ children }: any) => children;

const createChainableGesture = () => {
  const handler: any = {
    onStart: () => handler,
    onUpdate: () => handler,
    onEnd: () => handler,
    onChange: () => handler,
    onFinalize: () => handler,
    enabled: () => handler,
    simultaneousWithExternalGesture: () => handler,
  };
  return handler;
};

export const Gesture = {
  Pan: () => createChainableGesture(),
  Tap: () => createChainableGesture(),
  LongPress: () => createChainableGesture(),
  Fling: () => createChainableGesture(),
  Pinch: () => createChainableGesture(),
  Rotation: () => createChainableGesture(),
};

export const Swipeable = ({ children }: any) => children;

export default {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
  Swipeable,
};
