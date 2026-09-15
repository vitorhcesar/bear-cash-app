import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useFocusEffect } from "expo-router";

import type { AppTabKey } from "@/presentation/components/app-bottom-bar";

type TabRepressHandler = () => void;

type TabRepressContextValue = {
  activeTab: AppTabKey;
  setActiveTab: (tab: AppTabKey) => void;
  reportTabFocus: (tab: AppTabKey) => void;
  registerTabRepress: (tab: AppTabKey, handler: TabRepressHandler) => () => void;
  triggerTabRepress: (tab: AppTabKey) => void;
};

const TabRepressContext = createContext<TabRepressContextValue | null>(null);

export function TabRepressProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTabState] = useState<AppTabKey>("home");
  const chosenTabRef = useRef<AppTabKey>("home");
  const handlersRef = useRef<Partial<Record<AppTabKey, TabRepressHandler>>>({});

  const setActiveTab = useCallback((tab: AppTabKey) => {
    chosenTabRef.current = tab;
    setActiveTabState(tab);
  }, []);

  const reportTabFocus = useCallback((tab: AppTabKey) => {
    if (tab === "home" && chosenTabRef.current !== "home") {
      return;
    }
    setActiveTabState(tab);
  }, []);

  const registerTabRepress = useCallback(
    (tab: AppTabKey, handler: TabRepressHandler) => {
      handlersRef.current[tab] = handler;
      return () => {
        if (handlersRef.current[tab] === handler) {
          delete handlersRef.current[tab];
        }
      };
    },
    [],
  );

  const triggerTabRepress = useCallback((tab: AppTabKey) => {
    handlersRef.current[tab]?.();
  }, []);

  return (
    <TabRepressContext.Provider
      value={{
        activeTab,
        setActiveTab,
        reportTabFocus,
        registerTabRepress,
        triggerTabRepress,
      }}
    >
      {children}
    </TabRepressContext.Provider>
  );
}

export function useTabRepress() {
  const context = useContext(TabRepressContext);
  if (!context) {
    throw new Error("useTabRepress must be used within TabRepressProvider");
  }
  return context;
}

export function useTabRepressHandler(
  tab: AppTabKey,
  handler: TabRepressHandler,
) {
  const { registerTabRepress } = useTabRepress();

  useEffect(() => {
    return registerTabRepress(tab, handler);
  }, [tab, handler, registerTabRepress]);
}

export function useReportTabFocus(tab: AppTabKey) {
  const { reportTabFocus, setActiveTab } = useTabRepress();

  useFocusEffect(
    useCallback(() => {
      if (tab === "home") {
        reportTabFocus(tab);
        return;
      }
      setActiveTab(tab);
    }, [reportTabFocus, setActiveTab, tab]),
  );
}
