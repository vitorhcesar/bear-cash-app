import { FigmaSvgIcon } from "@/presentation/components/ui/figma-svg-icon";
import {
  CREDIT_CARD_CALENDAR_XML,
  CREDIT_CARD_LIST_XML,
  CREDIT_CARD_STACK_XML,
} from "@/presentation/components/ui/credit-card-icon-xml";

type IconProps = {
  size?: number;
  color?: string;
};

export function CreditCardListIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={CREDIT_CARD_LIST_XML} size={size} color={color} />;
}

export function CreditCardCalendarIcon({ size = 16, color }: IconProps) {
  return (
    <FigmaSvgIcon xml={CREDIT_CARD_CALENDAR_XML} size={size} color={color} />
  );
}

export function CreditCardStackIcon({ size = 16, color }: IconProps) {
  return <FigmaSvgIcon xml={CREDIT_CARD_STACK_XML} size={size} color={color} />;
}
