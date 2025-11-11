import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";
import { Spacing, FontSizes } from "@/constants/colors";
import type { ThemeColors } from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

export default function NotFoundScreen() {
  const { theme } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.subtitle}>Sorry, this screen does not exist.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to Dashboard</Text>
        </Link>
      </View>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.xl,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: FontSizes.xxxl,
      fontWeight: "700" as const,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: FontSizes.lg,
      color: colors.textSecondary,
      marginBottom: Spacing.xl,
    },
    link: {
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      borderRadius: 12,
    },
    linkText: {
      fontSize: FontSizes.lg,
      color: colors.surface,
      fontWeight: "600" as const,
    },
  });
