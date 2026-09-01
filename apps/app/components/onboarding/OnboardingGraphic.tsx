import React from 'react';
import { View } from 'react-native';
import Svg, {
  Rect,
  Circle,
  Path,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';

interface OnboardingGraphicProps {
  slideId: number;
}

export function OnboardingGraphic({ slideId }: OnboardingGraphicProps) {
  if (slideId === 0) {
    // Graphic 0: Home Services & Professional Renovations
    return (
      <View className="items-center justify-center my-4">
        <Svg width="220" height="200" viewBox="0 0 220 200" fill="none">
          <Defs>
            <LinearGradient id="goldGrad" x1="0" y1="0" x2="220" y2="200">
              <Stop offset="0" stopColor="#C87D20" stopOpacity="1" />
              <Stop offset="1" stopColor="#EAB308" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="bgGrad0" x1="0" y1="0" x2="220" y2="200">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
              <Stop offset="1" stopColor="#F8F8FA" stopOpacity="0.8" />
            </LinearGradient>
          </Defs>

          {/* Glowing Background Rounded Plate */}
          <Rect x="10" y="10" width="200" height="180" rx="36" fill="url(#bgGrad0)" />
          <Circle cx="110" cy="100" r="65" fill="#C87D20" fillOpacity="0.12" />

          {/* Roof & House Structure */}
          <Path
            d="M50 115L110 55L170 115V155C170 160.5 165.5 165 160 165H60C54.5 165 50 160.5 50 155V115Z"
            fill="url(#goldGrad)"
          />

          {/* Door */}
          <Rect x="94" y="120" width="32" height="45" rx="6" fill="#18181B" />

          {/* Floating Wrench & Tools */}
          <G transform="translate(145, 60)">
            <Circle cx="15" cy="15" r="22" fill="#18181B" />
            <Path
              d="M10 8L20 18M18 10L10 18"
              stroke="#FFFFFF"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </G>

          {/* Electrical Sparkles */}
          <Path
            d="M38 70L32 82H40L34 94"
            stroke="#C87D20"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    );
  }

  if (slideId === 1) {
    // Graphic 1: Custom Furniture & Interior Architecture
    return (
      <View className="items-center justify-center my-4">
        <Svg width="220" height="200" viewBox="0 0 220 200" fill="none">
          <Defs>
            <LinearGradient id="goldGrad2" x1="0" y1="0" x2="220" y2="200">
              <Stop offset="0" stopColor="#18181B" stopOpacity="1" />
              <Stop offset="1" stopColor="#27272A" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Rounded Plate */}
          <Rect x="10" y="10" width="200" height="180" rx="36" fill="#FFFFFF" />
          <Circle cx="110" cy="100" r="65" fill="#C87D20" fillOpacity="0.1" />

          {/* Modern Armchair */}
          <Rect x="55" y="85" width="110" height="50" rx="16" fill="url(#goldGrad2)" />
          <Rect x="70" y="60" width="80" height="45" rx="12" fill="#C87D20" />
          <Rect x="45" y="90" width="20" height="40" rx="10" fill="#27272A" />
          <Rect x="155" y="90" width="20" height="40" rx="10" fill="#27272A" />

          {/* Legs */}
          <Path d="M65 135L55 160M155 135L165 160" stroke="#18181B" strokeWidth="4" strokeLinecap="round" />

          {/* Pendant Lamp */}
          <Path d="M110 10V40" stroke="#C87D20" strokeWidth="2" />
          <Path d="M95 40L125 40L135 55H85L95 40Z" fill="#C87D20" />
        </Svg>
      </View>
    );
  }

  // Graphic 2: Escrow Protection Vault & Shield
  return (
    <View className="items-center justify-center my-4">
      <Svg width="220" height="200" viewBox="0 0 220 200" fill="none">
        <Defs>
          <LinearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="150">
            <Stop offset="0" stopColor="#C87D20" />
            <Stop offset="1" stopColor="#18181B" />
          </LinearGradient>
        </Defs>

        <Rect x="10" y="10" width="200" height="180" rx="36" fill="#FFFFFF" />
        <Circle cx="110" cy="100" r="65" fill="#10B981" fillOpacity="0.1" />

        {/* Security Shield */}
        <Path
          d="M110 45L160 65V105C160 135 110 160 110 160C110 160 60 135 60 105V65L110 45Z"
          fill="url(#shieldGrad)"
        />

        {/* Lock Keyhole */}
        <Circle cx="110" cy="95" r="14" fill="#FFFFFF" />
        <Path d="M110 102V120" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        <Circle cx="110" cy="95" r="6" fill="#C87D20" />
      </Svg>
    </View>
  );
}

export default OnboardingGraphic;
