import { TouchableOpacity, Text } from "react-native";
import { useTheme } from "@/hooks/user-theme-mode";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <TouchableOpacity
      onPress={toggleTheme}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
    >
      <Text className="text-lg">{isDark ? "🌙" : "☀️"}</Text>
    </TouchableOpacity>
  );
}