import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '../../constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name: IconName;
  focusedName: IconName;
  focused: boolean;
  label: string;
}

const TabIcon: React.FC<TabIconProps> = ({ name, focusedName, focused, label }) => {
  const color = focused ? Colors.tabActive : Colors.tabInactive;
  return (
    <View style={styles.tabItem}>
      <Ionicons
        name={focused ? focusedName : name}
        size={24}
        color={color}
      />
      <Text
        numberOfLines={1}
        allowFontScaling={false}
        style={[styles.tabLabel, { color }]}
      >
        {label}
      </Text>
    </View>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      {/* Slot 1: Home */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home-outline" focusedName="home" focused={focused} label="Home" />
          ),
        }}
      />

      {/* Slot 2: Map */}
      <Tabs.Screen
        name="courses"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="map-outline" focusedName="map" focused={focused} label="Map" />
          ),
        }}
      />

      {/* Slot 3 (Center): Play */}
      <Tabs.Screen
        name="play"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="disc-outline" focusedName="disc" focused={focused} label="Play" />
          ),
        }}
      />

      {/* Slot 4: Groups */}
      <Tabs.Screen
        name="openplay"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="people-outline" focusedName="people" focused={focused} label="Groups" />
          ),
        }}
      />

      {/* Slot 5: Me */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person-outline" focusedName="person" focused={focused} label="Me" />
          ),
        }}
      />

      {/* Hidden screens — not shown in tab bar */}
      <Tabs.Screen name="bag" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: Layout.tabBarHeight,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    paddingTop: 10,
    elevation: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
  },
  tabLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0,
    textAlign: 'center',
  },
});
