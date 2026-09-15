import { PlaceholderTabPage } from "@/presentation/pages/PlaceholderTabPage";
import { useReportTabFocus } from "@/presentation/navigation/tab-repress-context";

export default function CommunityTabRoute() {
  useReportTabFocus("community");
  return (
    <PlaceholderTabPage title="Comunidade" subtitle="Em breve" />
  );
}
