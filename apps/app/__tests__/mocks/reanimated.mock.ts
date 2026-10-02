import React from 'react';

export const useSharedValue = (init: any) => ({ value: init });

export const useAnimatedStyle = (fn: any) => fn();

export const useDerivedValue = (fn: any) => ({ value: fn() });

export const withTiming = (toValue: any, config?: any, callback?: any) => {
  if (callback) callback(true);
  return toValue;
};

export const withSpring = (toValue: any, config?: any, callback?: any) => {
  if (callback) callback(true);
  return toValue;
};

export const withDelay = (delay: number, anim: any) => anim;

export const interpolate = (value: number, input: number[], output: number[]) => {
  if (value <= input[0]) return output[0];
  if (value >= input[input.length - 1]) return output[output.length - 1];
  return output[0];
};

export const Extrapolation = {
  CLAMP: 'clamp',
  EXTEND: 'extend',
  IDENTITY: 'identity',
};

export const Easing = {
  bezier: () => (t: number) => t,
  linear: (t: number) => t,
  ease: (t: number) => t,
};

export const Animated = {
  View: ({ children, style, ...props }: any) =>
    React.createElement('div', { style, ...props }, children),
  Text: ({ children, style, ...props }: any) =>
    React.createElement('span', { style, ...props }, children),
  ScrollView: ({ children, style, ...props }: any) =>
    React.createElement('div', { style, ...props }, children),
  createAnimatedComponent: (comp: any) => comp,
};

export default {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
  Easing,
  ...Animated,
};
