import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function RecordingsLayout() {
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
          title: "All Responses",
          headerTitleStyle: {
            fontSize: 28,
            fontWeight: "800" as const,
            color: Colors.light.text,
          },
        }}
      />
    </Stack>
  );
}
