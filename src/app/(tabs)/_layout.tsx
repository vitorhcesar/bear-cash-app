import { BlurTargetView } from "expo-blur";
import { Tabs, usePathname, useRouter } from "expo-router";
import { useRef } from "react";
import { StyleSheet, View } from "react-native";

import { BlurTargetProvider } from "@/presentation/blur/blur-target-context";
import {
  AppBottomBar,
  type AppTabKey,
} from "@/presentation/components/app-bottom-bar";
import { BearCashColors } from "@/presentation/constants/theme";

/** Espaço reservado para AI bar + nav + safe area */
export const APP_BOTTOM_CHROME_HEIGHT = 148;

export const unstable_settings = {
  initialRouteName: "index",
};

export default function TabsLayout() {
  const blurTargetRef = useRef<View | null>(null);

  return (
    <BlurTargetProvider value={blurTargetRef}>
      <View style={styles.root}>
        <BlurTargetView ref={blurTargetRef} style={styles.blurTarget}>
          <Tabs
            tabBar={() => null}
            screenOptions={{
              headerShown: false,
              sceneStyle: {
                backgroundColor: BearCashColors.background,
                paddingBottom: APP_BOTTOM_CHROME_HEIGHT,
              },
            }}
          >
            <Tabs.Screen name="index" options={{ title: "Home" }} />
            <Tabs.Screen name="activities" options={{ title: "Atividades" }} />
            <Tabs.Screen name="community" options={{ title: "Comunidade" }} />
          </Tabs>
        </BlurTargetView>

        <TabsChromeBar />
      </View>
    </BlurTargetProvider>
  );
}

function TabsChromeBar() {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab: AppTabKey = pathname.includes("community")
    ? "community"
    : pathname.includes("activities")
      ? "activities"
      : "home";

  return (
    <View style={styles.tabBarOverlay} pointerEvents="box-none">
      <AppBottomBar
        activeTab={activeTab}
        onTabPress={(tab) => {
          if (tab === "home") {
            router.navigate("/(tabs)");
            return;
          }
          if (tab === "activities") {
            router.navigate("/(tabs)/activities");
            return;
          }
          router.navigate("/(tabs)/community");
        }}
        onAskAiPress={() => router.push("/bear-cash-ia")}
        onSettingsPress={() => router.push("/settings")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BearCashColors.background,
  },
  blurTarget: {
    flex: 1,
  },
  tabBarOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
