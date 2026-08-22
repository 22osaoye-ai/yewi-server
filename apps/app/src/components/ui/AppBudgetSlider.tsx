import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Shadows } from '../Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AppBudgetSliderProps {
  min: number;
  max: number;
  minValue: number;
  maxValue: number;
  onRangeChange: (minVal: number, maxVal: number) => void;
}

const PRESET_RANGES = [
  { label: '30 - 100 €', min: 30, max: 100 },
  { label: '100 - 300 €', min: 100, max: 300 },
  { label: '300 - 600 €', min: 300, max: 600 },
  { label: '600 - 1500 €+', min: 600, max: 1500 },
];

export const AppBudgetSlider: React.FC<AppBudgetSliderProps> = ({
  min = 20,
  max = 1500,
  minValue,
  maxValue,
  onRangeChange,
}) => {
  const [sliderWidth, setSliderWidth] = useState(SCREEN_WIDTH - 80);

  const handlePreset = (pMin: number, pMax: number) => {
    onRangeChange(pMin, pMax);
  };

  const handleTrackTouch = (e: any) => {
    const touchX = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, touchX / (sliderWidth || 1)));
    const calculatedValue = Math.round((min + ratio * (max - min)) / 10) * 10;

    // Ajusta el más cercano (mín o máx)
    if (Math.abs(calculatedValue - minValue) < Math.abs(calculatedValue - maxValue)) {
      if (calculatedValue < maxValue) {
        onRangeChange(calculatedValue, maxValue);
      }
    } else {
      if (calculatedValue > minValue) {
        onRangeChange(minValue, calculatedValue);
      }
    }
  };

  const leftPercent = Math.max(0, Math.min(1, (minValue - min) / (max - min))) * 100;
  const rightPercent = Math.max(0, Math.min(1, (maxValue - min) / (max - min))) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Rango de Presupuesto Estimado</Text>
        <Text style={styles.rangeValueText}>
          {minValue} € - {maxValue} €
        </Text>
      </View>

      {/* Interactive Slider Track */}
      <View
        style={styles.trackContainer}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        onTouchEnd={handleTrackTouch}
      >
        <View style={styles.trackBackground} />
        <View
          style={[
            styles.trackActive,
            {
              left: `${leftPercent}%`,
              width: `${Math.max(4, rightPercent - leftPercent)}%`,
            },
          ]}
        />
        {/* Min Thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: `${leftPercent}%`,
              marginLeft: -12,
            },
          ]}
        />
        {/* Max Thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: `${rightPercent}%`,
              marginLeft: -12,
            },
          ]}
        />
      </View>

      {/* Preset Quick Selection Pills */}
      <View style={styles.presetsRow}>
        {PRESET_RANGES.map((preset) => {
          const isSelected =
            minValue === preset.min && maxValue === preset.max;
          return (
            <TouchableOpacity
              key={preset.label}
              style={[
                styles.presetPill,
                isSelected && styles.presetPillActive,
              ]}
              onPress={() => handlePreset(preset.min, preset.max)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.presetPillText,
                  isSelected && styles.presetPillTextActive,
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111813',
  },
  rangeValueText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111813',
  },
  trackContainer: {
    height: 32,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  trackBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E8E2D5',
    width: '100%',
  },
  trackActive: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#111813',
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#111813',
    ...Shadows.subtle,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  presetPill: {
    flex: 1,
    minWidth: 70,
    backgroundColor: '#F5ECE3',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 9999,
    alignItems: 'center',
  },
  presetPillActive: {
    backgroundColor: '#111813',
  },
  presetPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6C756F',
  },
  presetPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
