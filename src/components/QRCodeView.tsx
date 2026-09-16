import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { generateQRMatrix, QRErrorCorrectionLevel } from '@/utils/qrCode';

export interface QRCodeViewProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  level?: QRErrorCorrectionLevel;
  margin?: number;
  style?: ViewStyle;
}

export function QRCodeView({
  value,
  size = 140,
  color = '#111827',
  backgroundColor = '#FFFFFF',
  level = 'M',
  margin = 2,
  style,
}: QRCodeViewProps) {
  const { matrix, cellSize, totalCells } = useMemo(() => {
    try {
      const mat = generateQRMatrix(value || ' ', level);
      const moduleCount = mat.length;
      const total = moduleCount + margin * 2;
      const cell = size / total;
      return { matrix: mat, cellSize: cell, totalCells: total };
    } catch (e) {
      console.warn('Error generating QR matrix:', e);
      return { matrix: [], cellSize: 0, totalCells: 0 };
    }
  }, [value, size, level, margin]);

  if (!matrix || matrix.length === 0) {
    return <View style={[{ width: size, height: size, backgroundColor }, style]} />;
  }

  const moduleCount = matrix.length;

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Rect x={0} y={0} width={size} height={size} fill={backgroundColor} />
        {matrix.map((row, r) =>
          row.map((isDark, c) => {
            if (!isDark) return null;
            const x = (c + margin) * cellSize;
            const y = (r + margin) * cellSize;
            return (
              <Rect
                key={`${r}-${c}`}
                x={Number(x.toFixed(2))}
                y={Number(y.toFixed(2))}
                width={Number(cellSize.toFixed(2))}
                height={Number(cellSize.toFixed(2))}
                fill={color}
              />
            );
          })
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 8,
  },
});

export default QRCodeView;
