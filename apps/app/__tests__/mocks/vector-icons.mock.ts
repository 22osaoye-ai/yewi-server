import React from 'react';

const createIconMock = (family: string) => {
  return ({ name, size, color, style, ...props }: any) =>
    React.createElement('span', {
      'data-icon-family': family,
      'data-icon-name': name,
      'data-icon-size': size,
      'data-icon-color': color,
      style,
      ...props,
    });
};

export const Ionicons = createIconMock('Ionicons');
export const Feather = createIconMock('Feather');
export const MaterialIcons = createIconMock('MaterialIcons');
export const FontAwesome = createIconMock('FontAwesome');
export const MaterialCommunityIcons = createIconMock('MaterialCommunityIcons');

export default {
  Ionicons,
  Feather,
  MaterialIcons,
  FontAwesome,
  MaterialCommunityIcons,
};
