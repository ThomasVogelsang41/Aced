import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Typo } from './Typography';
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ScoreTrendMountainChartProps {
  avgScore?: string;
}

export const ScoreTrendMountainChart: React.FC<ScoreTrendMountainChartProps> = ({
  avgScore = '-1.3',
}) => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <Typo variant="label" style={styles.chartTitle}>SCORE TREND</Typo>
        <View style={styles.avgBadge}>
          <Typo style={styles.avgValue}>{avgScore}</Typo>
          <Typo style={styles.avgLabel}>Avg</Typo>
        </View>
      </View>

      <View style={styles.chartBox}>
        <LineChart
          data={{
            labels: ['Feb 20', 'Mar 20', 'Apr 20', 'May 20'],
            datasets: [
              {
                data: [-5, -2, 1, -1, -5, -3, -2, -4, -1, 0, -1, 1, 3.2, 2.8, -2, -0.5, 0.2, -1.3],
                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                strokeWidth: 2.5,
              },
            ],
          }}
          width={SCREEN_WIDTH - 64}
          height={140}
          bezier
          withDots={true}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          chartConfig={{
            backgroundColor: Colors.white,
            backgroundGradientFrom: Colors.white,
            backgroundGradientTo: Colors.white,
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(30, 41, 59, ${opacity})`,
            propsForLabels: {
              fontSize: 10,
              fontWeight: '700',
            },
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '3.5',
              strokeWidth: '1.5',
              stroke: '#FFFFFF',
              fill: '#2563EB',
            },
            propsForBackgroundLines: {
              stroke: Colors.border,
              strokeDasharray: '3 3',
            },
          }}
          style={styles.chartStyle}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    ...Shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chartTitle: {
    color: Colors.secondaryText,
    letterSpacing: 0.8,
    fontSize: 11,
    fontWeight: 'bold',
  },
  avgBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  avgValue: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.primaryBlack,
  },
  avgLabel: {
    fontSize: 11,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  chartBox: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 4,
  },
  chartStyle: {
    marginVertical: 4,
    borderRadius: BorderRadius.lg,
  },
});
