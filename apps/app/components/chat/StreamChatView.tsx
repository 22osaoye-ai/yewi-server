import React from 'react';
import { View, Text } from 'react-native';

interface StreamChatViewProps {
  client?: any;
  channel?: any;
  theme?: any;
  children?: React.ReactNode;
}

export function StreamChatView({
  children,
}: StreamChatViewProps) {
  return (
    <View style={{ flex: 1, backgroundColor: '#141416' }}>
      {children}
    </View>
  );
}

export const isStreamNativeSupported = false;


