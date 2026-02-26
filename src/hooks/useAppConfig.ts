import { useMemo } from "react";

type AppConfig = {
  apiUrl: string;
  appName: string;
  environment: string;
  active: boolean;
  uiMode: "light" | "dark";
  loading: boolean;
};

export const useAppConfig = (): AppConfig => {
  const config = useMemo<AppConfig>(() => {
    return {
      apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
      appName: process.env.NEXT_PUBLIC_APP_NAME ?? "My App",
      environment: process.env.NODE_ENV ?? "development",
      active: true,
      uiMode: "light",
      loading: false,
    };
  }, []);

  return config;
};