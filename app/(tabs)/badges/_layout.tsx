import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function BadgesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.light.background },
        headerTintColor: Colors.light.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Badges & Achievements",
          headerTitleStyle: {
            fontSize: 22,
            fontWeight: "800" as const,
            color: Colors.light.text,
          },
        }}
      />
    </Stack>
  );
}
