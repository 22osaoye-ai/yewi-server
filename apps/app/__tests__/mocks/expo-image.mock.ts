import React from 'react';

export const Image = ({ source, style, ...props }: any) =>
  React.createElement('img', {
    src: typeof source === 'object' ? source?.uri : source,
    style,
    ...props,
  });

export default {
  Image,
};
