import React from 'react';

export const GlassView = ({ children, ...props }: any) => {
  return React.createElement('View', props, children);
};

export default {
  GlassView,
};
