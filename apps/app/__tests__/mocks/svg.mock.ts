import React from 'react';

export const Svg = ({ children, ...props }: any) => React.createElement('svg', props, children);
export const Path = ({ ...props }: any) => React.createElement('path', props);
export const Circle = ({ ...props }: any) => React.createElement('circle', props);
export const Rect = ({ ...props }: any) => React.createElement('rect', props);

export default Svg;
