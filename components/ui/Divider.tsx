import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

interface DividerProps {
  marginVertical?: number;
  color?: string;
}

export const Divider: React.FC<DividerProps> = ({
  marginVertical = 0,
  color = Colors.border,
}) => (
  <View style={[styles.divider, { marginVertical, backgroundColor: color }]} />
);

const styles = StyleSheet.create({
  divider: {
    height: 1,
    width: '100%',
  },
});
