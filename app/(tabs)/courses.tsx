import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Typo } from '../../components/ui/Typography';
import { CourseListItem } from '../../components/CourseListItem';
import { Colors, Spacing, Layout, BorderRadius, Typography } from '../../constants/theme';
import { useLocation } from '../../hooks/useLocation';
import { useNearestCourses } from '../../hooks/useNearestCourses';
import { searchCourses } from '../../lib/discgolfapi';

export default function CoursesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { latitude, longitude, isLoading: locLoading } = useLocation();
  const { data: nearbyCourses, isLoading: nearbyLoading } = useNearestCourses(latitude, longitude, 75);

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['courseSearch', searchQuery],
    queryFn: () => searchCourses(searchQuery, 25),
    enabled: searchQuery.trim().length >= 3,
    staleTime: 5 * 60 * 1000,
  });

  const showSearch = searchQuery.trim().length >= 3;
  const courses = showSearch ? searchResults : nearbyCourses;
  const isLoading = showSearch ? searchLoading : (locLoading || nearbyLoading);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Typo variant="h2">Courses</Typo>
        {latitude && longitude && (
          <Typo variant="small" style={styles.locationTag}>
            <Ionicons name="location" size={12} color={Colors.blue} /> Near you
          </Typo>
        )}
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses by name or city..."
            placeholderTextColor={Colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearching(true)}
            onBlur={() => setIsSearching(false)}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {isLoading && <ActivityIndicator size="small" color={Colors.blue} />}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!showSearch && (
          <Typo variant="label" style={styles.sectionLabel}>
            {locLoading ? 'Finding nearby courses...' : `${nearbyCourses?.length ?? 0} Courses Nearby`}
          </Typo>
        )}
        {showSearch && (
          <Typo variant="label" style={styles.sectionLabel}>
            Search Results
          </Typo>
        )}

        {courses?.map((course) => (
          <CourseListItem
            key={course.id}
            course={course}
            onPress={() =>
              router.push({ pathname: '/course/[id]', params: { id: course.id } })
            }
          />
        ))}

        {!isLoading && (!courses || courses.length === 0) && (
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={40} color={Colors.gray300} />
            <Typo variant="body" style={styles.emptyTitle}>
              {showSearch ? 'No courses found' : 'No courses nearby'}
            </Typo>
            <Typo variant="small" style={styles.emptyText}>
              {showSearch
                ? 'Try a different search term'
                : 'Enable location to find courses near you'}
            </Typo>
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  locationTag: { color: Colors.blue },
  searchContainer: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing.base,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSoft,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.primaryBlack,
    padding: 0,
  },
  scroll: { flex: 1 },
  list: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing.sm,
  },
  sectionLabel: {
    marginBottom: Spacing.md,
    color: Colors.secondaryText,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: Spacing.sm,
  },
  emptyTitle: { color: Colors.primaryBlack, marginTop: Spacing.sm },
  emptyText: { color: Colors.secondaryText, textAlign: 'center' },
  bottomPad: { height: 32 },
});
