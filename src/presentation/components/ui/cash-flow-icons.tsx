import { FigmaSvgIcon } from "@/presentation/components/ui/figma-svg-icon";
import { CASH_FLOW_INFO_XML } from "@/presentation/components/ui/cash-flow-icon-xml";

type IconProps = {
  size?: number;
  color?: string;
};

export function CashFlowInfoIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={CASH_FLOW_INFO_XML} size={size} color={color} />;
}
