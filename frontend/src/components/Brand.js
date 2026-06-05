import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

export function BrandMark({ size = 56, tone = 'auto', showDot = true, style }) {
  const { colors, resolvedMode } = useTheme();
  const isDark = tone === 'auto' ? resolvedMode === 'dark' : tone === 'dark';

  const bg = isDark ? colors.ink : colors.surfaceRaised;
  const fg = isDark ? colors.onInk : colors.ink;
  const dot = colors.accent;

  const ratio = size / 56;
  const barW = 32 * ratio;
  const barH = 6 * ratio;
  const stemW = 6 * ratio;
  const stemH = 30 * ratio;
  const top = 14 * ratio;
  const left = (size - barW) / 2;
  const stemLeft = (size - stemW) / 2;
  const dotSize = 8 * ratio;
  const dotOffset = 6 * ratio;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: 14 * ratio,
          backgroundColor: bg,
          borderColor: isDark ? colors.border : colors.border,
        },
        style,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          top,
          left,
          width: barW,
          height: barH,
          borderRadius: barH / 2,
          backgroundColor: fg,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: top + barH,
          left: stemLeft,
          width: stemW,
          height: stemH,
          borderRadius: stemW / 2,
          backgroundColor: fg,
        }}
      />
      {showDot ? (
        <View
          style={{
            position: 'absolute',
            bottom: dotOffset,
            right: dotOffset,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dot,
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
