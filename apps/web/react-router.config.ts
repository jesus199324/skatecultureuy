import type { Config } from "@react-router/dev/config";

/** React Router en modo framework con render en el servidor (SSR). */
export default {
  appDirectory: "app",
  ssr: true,
} satisfies Config;
