import React, { forwardRef } from 'react';
import { Image, type ImageProps } from 'react-native';

const AppImage = forwardRef<React.ComponentRef<typeof Image>, ImageProps>(
  function ImageComponent({ resizeMode = 'cover', ...props }, ref) {
    return <Image ref={ref} resizeMode={resizeMode} {...props} />;
  },
);

export default AppImage;
