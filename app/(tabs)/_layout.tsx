import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typo } from '../../components/ui/Typography';
import { Colors, Typography, Layout } from '../../constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name: IconName;
  focusedName: IconName;
  focused: boolean;
  label: string;
  isPlay?: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ name, focusedName, focused, label, isPlay }) => {
  if (isPlay) {
    return (
      <View style={styles.playWrapper}>
        <View style={[styles.playBtn, focused && styles.playBtnActive]}>
          <Ionicons
            name={focused ? focusedName : name}
            size={24}
            color={Colors.white}
          />
        </View>
        <Typo
          style={[
            styles.tabLabel,
            { color: focused ? Colors.blue : Colors.tabInactive },
          ]}
        >
          {label}
        </Typo>
      </View>
    );
  }

  return (
    <View style={styles.tabItem}>
      <Ionicons
        name={focused ? focusedName : name}
        size={24}
        color={focused ? Colors.tabActive : Colors.tabInactive}
      />
      <Typo
        style={[
          styles.tabLabel,
          { color: focused ? Colors.tabActive : Colors.tabInactive },
        ]}
      >
        {label}
      </Typo>
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
      <Tabs.Screen
        name="courses"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="map-outline"
              focusedName="map"
              focused={focused}
              label="Courses"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="disc-outline"
              focusedName="disc"
              focused={focused}
              label="Play"
              isPlay
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bag"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="bag-outline"
              focusedName="bag"
              focused={focused}
              label="Bag"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="person-outline"
              focusedName="person"
              focused={focused}
              label="Profile"
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
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    elevation: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 10,
    lineHeight: 12,
  },
  // Play tab — elevated treatment
  playWrapper: {
    alignItems: 'center',
    gap: 3,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -12,
  },
  playBtnActive: {
    backgroundColor: Colors.blue,
  },
});
