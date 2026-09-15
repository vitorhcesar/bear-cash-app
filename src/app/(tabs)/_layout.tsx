import { BlurTargetView } from "expo-blur";
import { Tabs, useRouter } from "expo-router";
import { useRef } from "react";
import { StyleSheet, View } from "react-native";

import { BlurTargetProvider } from "@/presentation/blur/blur-target-context";
import {
  AppBottomBar,
  type AppTabKey,
} from "@/presentation/components/app-bottom-bar";
import { BearCashColors } from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";
import {
  TabRepressProvider,
  useTabRepress,
} from "@/presentation/navigation/tab-repress-context";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function TabsLayout() {
  const styles = useStyles();
  const blurTargetRef = useRef<View | null>(null);

  return (
    <TabRepressProvider>
      <BlurTargetProvider value={blurTargetRef}>
        <View style={styles.root}>
          <BlurTargetView ref={blurTargetRef} style={styles.blurTarget}>
            <Tabs
              tabBar={() => null}
              screenOptions={() => ({
                headerShown: false,
                tabBarStyle: {
                  display: "none",
                  backgroundColor: "transparent",
                  borderTopWidth: 0,
                  elevation: 0,
                  position: "absolute",
                },
                sceneStyle: {
                  backgroundColor: BearCashColors.background,
                },
              })}
            >
              <Tabs.Screen name="index" options={{ title: "Home" }} />
              <Tabs.Screen
                name="activities"
                options={{ title: "Atividades" }}
              />
              <Tabs.Screen name="community" options={{ title: "Comunidade" }} />
            </Tabs>
          </BlurTargetView>

          <TabsChromeBar />
        </View>
      </BlurTargetProvider>
    </TabRepressProvider>
  );
}

function TabsChromeBar() {
  const styles = useStyles();
  const router = useRouter();
  const { activeTab, setActiveTab, triggerTabRepress } = useTabRepress();

  function handleTabPress(tab: AppTabKey) {
    if (tab === activeTab) {
      if (tab === "home" || tab === "activities") {
        triggerTabRepress(tab);
      }
      return;
    }

    setActiveTab(tab);

    if (tab === "home") {
      router.navigate("/(tabs)");
      return;
    }
    if (tab === "activities") {
      router.navigate("/(tabs)/activities");
      return;
    }
    router.navigate("/(tabs)/community");
  }

  return (
    <View style={styles.tabBarOverlay} pointerEvents="box-none">
      <AppBottomBar
        activeTab={activeTab}
        onTabPress={handleTabPress}
        onAskAiPress={() => router.push("/bear-cash-ia")}
        onSettingsPress={() => router.push("/settings")}
      />
    </View>
  );
}

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
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
      backgroundColor: "transparent",
    },
  }),
);
