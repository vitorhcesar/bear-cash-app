import { HomePage } from "@/presentation/pages/HomePage";
import { useReportTabFocus } from "@/presentation/navigation/tab-repress-context";

export default function HomeTabRoute() {
  useReportTabFocus("home");
  return <HomePage />;
}
