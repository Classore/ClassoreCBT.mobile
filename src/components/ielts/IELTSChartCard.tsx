import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Line, Circle, Polyline, Text as SvgText, Rect } from 'react-native-svg';
import { AppText } from '@/components/AppText';

interface IELTSChartCardProps {
  imageUrl?: string | null;
  title?: string;
}

export const IELTSChartCard: React.FC<IELTSChartCardProps> = ({
  imageUrl,
  title = 'Number of Visitors to the Museum (2015–2020)',
}) => {
  // If a real image URL is supplied, display the image
  if (imageUrl) {
    return (
      <View style={styles.container}>
        <AppText style={styles.chartTitle}>{title}</AppText>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="contain"
        />
      </View>
    );
  }

  // Vector chart matching Image 2
  const chartWidth = Dimensions.get('window').width - 72; // responsive width
  const chartHeight = 180;
  const paddingLeft = 46;
  const paddingBottom = 26;
  const paddingTop = 20;
  const paddingRight = 20;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Y-axis values: 0, 25k, 50k, 75k, 100k
  const yLabels = ['100,000', '75,000', '50,000', '25,000', '0'];
  // X-axis values: 2015 to 2020
  const xLabels = ['2015', '2016', '2017', '2018', '2019', '2020'];

  // Points (val between 0 and 100,000):
  const rawData = [7000, 30000, 42000, 56000, 59000, 72000];

  const points = rawData.map((val, index) => {
    const x = paddingLeft + (index / (rawData.length - 1)) * innerWidth;
    const y = paddingTop + innerHeight - (val / 100000) * innerHeight;
    return { x, y };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View style={styles.container}>
      <AppText style={styles.chartTitle}>{title}</AppText>
      <View style={styles.svgWrapper}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Horizontal grid lines */}
          {yLabels.map((lbl, idx) => {
            const y = paddingTop + (idx / (yLabels.length - 1)) * innerHeight;
            return (
              <React.Fragment key={lbl}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#EDE9FE"
                  strokeWidth={1}
                />
                <SvgText
                  x={paddingLeft - 6}
                  y={y + 3}
                  fontSize={9}
                  fill="#9CA3AF"
                  textAnchor="end"
                >
                  {lbl}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* X axis labels */}
          {xLabels.map((lbl, idx) => {
            const x = paddingLeft + (idx / (xLabels.length - 1)) * innerWidth;
            return (
              <SvgText
                key={lbl}
                x={x}
                y={chartHeight - 6}
                fontSize={9}
                fill="#9CA3AF"
                textAnchor="middle"
              >
                {lbl}
              </SvgText>
            );
          })}

          {/* Line connecting points */}
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke="#6D28D9"
            strokeWidth={2.5}
          />

          {/* Dots on line */}
          {points.map((p, idx) => (
            <Circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={4}
              fill="#6D28D9"
            />
          ))}
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
});
