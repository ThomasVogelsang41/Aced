import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typo } from './ui/Typography';
import { Badge } from './ui/Badge';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import type { Course } from '../types/course';

interface CourseListItemProps {
  course: Course;
  onPress?: () => void;
}

export const CourseListItem: React.FC<CourseListItemProps> = ({ course, onPress }) => {
  const statusColor = course.status === 'closed' ? 'orange' : 'green';
  const statusLabel = course.status === 'closed' ? 'Closed' : 'Open';

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.left}>
        <View style={styles.iconBox}>
          <Ionicons name="map" size={20} color={Colors.blue} />
        </View>
      </View>
      <View style={styles.content}>
        <Typo variant="bodyMedium" style={styles.name} numberOfLines={1}>
          {course.name}
        </Typo>
        <Typo variant="small">
          {course.city}, {course.state}
        </Typo>
        <View style={styles.meta}>
          <Badge label={`${course.holeCount} holes`} variant="gray" />
          {course.status && (
            <Badge label={statusLabel} variant={statusColor} />
          )}
        </View>
      </View>
      <View style={styles.right}>
        {course.distanceMiles !== undefined && (
          <Typo variant="small" style={styles.distance}>
            {course.distanceMiles < 10
              ? `${course.distanceMiles.toFixed(1)} mi`
              : `${Math.round(course.distanceMiles)} mi`}
          </Typo>
        )}
        <Ionicons name="chevron-forward" size={16} color={Colors.gray300} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  pressed: {
    opacity: 0.8,
    backgroundColor: Colors.backgroundSoft,
  },
  left: {
    marginRight: Spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: Colors.primaryBlack,
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
    gap: 4,
  },
  distance: {
    color: Colors.secondaryText,
  },
});
