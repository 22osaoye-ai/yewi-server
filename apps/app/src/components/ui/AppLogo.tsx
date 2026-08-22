import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Typography } from '../Theme';

interface AppLogoProps {
  size?: number;
  textColor?: string;
  dotColor?: string;
  style?: ViewStyle;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 26,
  textColor = '#111813',
  dotColor = '#E05A47',
  style,
}) => {
  return (
    <View style={[styles.logoRow, style]}>
      <Text
        style={[
          styles.logoText,
          {
            fontSize: size,
            color: textColor,
          },
        ]}
      >
        Yewi
      </Text>
      <Text
        style={[
          styles.logoDot,
          {
            fontSize: size,
            color: dotColor,
          },
        ]}
      >
        .
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontFamily: Typography.fonts.black,
    fontWeight: '900',
    letterSpacing: -1,
  },
  logoDot: {
    fontFamily: Typography.fonts.black,
    fontWeight: '900',
  },
});
