import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Layout } from '../../constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name?: IconName;
  focusedName?: IconName;
  focused: boolean;
  label: string;
  customIcon?: React.ReactNode;
}

const TabIcon: React.FC<TabIconProps> = ({ name, focusedName, focused, label, customIcon }) => {
  const color = focused ? Colors.tabActive : Colors.tabInactive;
  return (
    <View style={styles.tabItem}>
      {customIcon ? (
        customIcon
      ) : (
        <Ionicons
          name={focused ? focusedName! : name!}
          size={25}
          color={color}
        />
      )}
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

// Custom Disc Golf Backpack Icon (backpack with top disc pocket slot & disc)
const DiscGolfBagIcon: React.FC<{ focused: boolean }> = ({ focused }) => {
  const color = focused ? Colors.tabActive : Colors.tabInactive;
  return (
    <View style={styles.discBagContainer}>
      {/* Disc peeking out top */}
      <View style={[styles.discPeek, { borderColor: color }]} />
      {/* Main Backpack Body */}
      <View style={[styles.backpackBody, { borderColor: color }]}>
        {/* Front Zip Pocket / Strap */}
        <View style={[styles.frontPocket, { borderColor: color }]} />
      </View>
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
            <TabIcon
              name="home-outline"
              focusedName="home"
              focused={focused}
              label="Home"
            />
          ),
        }}
      />

      {/* Slot 2: Map */}
      <Tabs.Screen
        name="courses"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="map-outline"
              focusedName="map"
              focused={focused}
              label="Map"
            />
          ),
        }}
      />

      {/* Slot 3 (Center): Play */}
      <Tabs.Screen
        name="play"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="disc-outline"
              focusedName="disc"
              focused={focused}
              label="Play"
            />
          ),
        }}
      />

      {/* Slot 4: Bag (Disc Golf Backpack) */}
      <Tabs.Screen
        name="bag"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label="Bag"
              customIcon={<DiscGolfBagIcon focused={focused} />}
            />
          ),
        }}
      />

      {/* Slot 5: Me */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="person-outline"
              focusedName="person"
              focused={focused}
              label="Me"
            />
          ),
        }}
      />
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

  // Disc Golf Bag Icon Styles
  discBagContainer: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  discPeek: {
    position: 'absolute',
    top: 0,
    width: 16,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1.8,
    borderBottomWidth: 0,
  },
  backpackBody: {
    width: 20,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
    backgroundColor: Colors.white,
  },
  frontPocket: {
    width: 14,
    height: 7,
    borderRadius: 2,
    borderWidth: 1.2,
  },
});
