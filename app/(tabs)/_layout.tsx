import { Tabs } from "expo-router";
import { MessageSquare, BarChart3, User, Award } from "lucide-react-native";
import React from "react";
import Colors from "@/constants/colors";
import { Platform, View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.light.surface,
          borderTopColor: Colors.light.borderLight,
          borderTopWidth: 1,
          ...(Platform.OS === 'web' ? {} : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 8,
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600" as const,
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Practice",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? {
              backgroundColor: Colors.light.tintLight,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 4,
            } : undefined}>
              <MessageSquare size={size - 2} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="recordings"
        options={{
          title: "History",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? {
              backgroundColor: Colors.light.tintLight,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 4,
            } : undefined}>
              <BarChart3 size={size - 2} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="badges"
        options={{
          title: "Badges",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? {
              backgroundColor: Colors.light.badgeLight,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 4,
            } : undefined}>
              <Award size={size - 2} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? {
              backgroundColor: Colors.light.levelLight,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 4,
            } : undefined}>
              <User size={size - 2} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
