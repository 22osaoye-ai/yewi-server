import React from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';


export type TabRoute = 'home' | 'search' | 'favorites' | 'profile';

interface FloatingBottomNavigationProps {
  currentTab: TabRoute;
  onTabPress: (tab: TabRoute) => void;
}

// Custom SVG Icons matching the exact mockup
function HomeIcon({ color = '#FFFFFF', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5L20 9.8V19C20 19.8 19.3 20.5 18.5 20.5H5.5C4.7 20.5 4 19.8 4 19V9.8L12 3.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 16.5H14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function SearchIcon({ color = '#E4E4E7', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.8" />
      <Path d="M20 20L16 16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function HeartIcon({ color = '#E4E4E7', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20.5C12 20.5 3 14.5 3 8.5C3 5.5 5.5 3 8.5 3C10.2 3 11.5 3.9 12 5C12.5 3.9 13.8 3 15.5 3C18.5 3 21 5.5 21 8.5C21 14.5 12 20.5 12 20.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProfileIcon({ color = '#E4E4E7', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7.5" r="4" stroke={color} strokeWidth="1.8" />
      <Path
        d="M4.5 19.5C5.8 16.8 8.6 15 12 15C15.4 15 18.2 16.8 19.5 19.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

const TABS: { id: TabRoute; label: string; icon: any }[] = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'search', label: 'Search', icon: SearchIcon },
  { id: 'favorites', label: 'Style', icon: HeartIcon },
  { id: 'profile', label: 'Profile', icon: ProfileIcon },
];

export const FloatingBottomNavigation: React.FC<FloatingBottomNavigationProps> = ({
  currentTab,
  onTabPress,
}) => {
  const handlePress = (tab: TabRoute) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onTabPress(tab);
  };

  return (
    <View className="absolute bottom-6 left-4 right-4 items-center z-50 pointer-events-box-none">
      <View className="flex-row items-center justify-between bg-[#191614] rounded-full p-2 w-full shadow-2xl elevation-16">
        {TABS.map((tab) => {
          const isActive = currentTab === tab.id;
          const IconComponent = tab.icon;

          if (isActive) {
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => handlePress(tab.id)}
                activeOpacity={0.9}
                className="flex-row items-center bg-white rounded-full p-1 pr-5 shadow-md elevation-4"
              >
                <View className="w-[48px] h-[48px] rounded-full bg-[#C87D20] items-center justify-center">
                  <IconComponent color="#FFFFFF" size={24} />
                </View>
                <Text className="font-satoshi-bold text-[#18181B] text-[15px] ml-3 tracking-tight">
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => handlePress(tab.id)}
              activeOpacity={0.8}
              className="w-[48px] h-[48px] rounded-full bg-[#2A2520] items-center justify-center"
            >
              <IconComponent color="#E4E4E7" size={22} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
