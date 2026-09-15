import { ActivitiesPage } from "@/presentation/pages/ActivitiesPage";
import { useReportTabFocus } from "@/presentation/navigation/tab-repress-context";

export default function ActivitiesTabRoute() {
  useReportTabFocus("activities");
  return <ActivitiesPage />;
}
