import React from 'react';

// Lightweight React Native mock for fast, deterministic unit & component testing
export const View = ({ children, testID, style, ...props }: any) =>
  React.createElement('div', { 'data-testid': testID, style, ...props }, children);

export const Text = ({ children, testID, style, numberOfLines, ...props }: any) =>
  React.createElement('span', { 'data-testid': testID, 'data-lines': numberOfLines, style, ...props }, children);

export const FlatList = ({ data, renderItem, keyExtractor, ListEmptyComponent, ...props }: any) =>
  React.createElement(
    'div',
    props,
    data && data.length > 0
      ? data.map((item: any, index: number) =>
          React.createElement(
            'div',
            { key: keyExtractor ? keyExtractor(item, index) : index },
            renderItem({ item, index })
          )
        )
      : ListEmptyComponent
        ? typeof ListEmptyComponent === 'function'
          ? React.createElement(ListEmptyComponent)
          : ListEmptyComponent
        : null
  );

export const TextInput = ({ value, onChangeText, placeholder, testID, ...props }: any) =>
  React.createElement('input', {
    'data-testid': testID,
    value,
    placeholder,
    onChange: (e: any) => onChangeText && onChangeText(e.target.value),
    ...props,
  });

export const RefreshControl = ({ ...props }: any) => React.createElement('div', props);

export const Pressable = ({ children, onPress, testID, style, disabled, ...props }: any) =>
  React.createElement(
    'button',
    {
      'data-testid': testID,
      onClick: disabled ? undefined : onPress,
      disabled,
      style,
      ...props,
    },
    typeof children === 'function' ? children({ pressed: false }) : children
  );

export const ScrollView = ({ children, testID, ...props }: any) =>
  React.createElement('div', { 'data-testid': testID, ...props }, children);

export const KeyboardAvoidingView = ({ children, ...props }: any) =>
  React.createElement('div', props, children);

export const ActivityIndicator = ({ ...props }: any) =>
  React.createElement('div', { 'data-testid': 'activity-indicator', ...props });

export const StyleSheet = {
  create: (styles: any) => styles,
  flatten: (styles: any) => (Array.isArray(styles) ? Object.assign({}, ...styles) : styles || {}),
  absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  hairlineWidth: 1,
};

export const Platform = {
  OS: 'ios',
  select: (obj: any) => obj.ios || obj.default,
};

export const useWindowDimensions = () => ({
  width: 390,
  height: 844,
  scale: 3,
  fontScale: 1,
});

export const Dimensions = {
  get: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
  addEventListener: () => ({ remove: () => {} }),
};

export default {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Dimensions,
};
