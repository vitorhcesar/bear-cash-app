import { useMemo } from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";

import {
  BEAR_CASH_IA_CHAT_XML,
  BEAR_CASH_IA_CLOSE_XML,
  BEAR_CASH_IA_PLUS_XML,
  BEAR_CASH_IA_SEND_XML,
} from "@/presentation/components/ui/bear-cash-ia-icon-xml";

type IconProps = {
  size?: number;
  color?: string;
};

function tintFigmaIcon(xml: string, color: string) {
  return xml.replace(/#(?:373A36|0A0B0A|E0E2DF)/gi, color);
}

function FigmaIcon({
  xml,
  size,
  color,
}: {
  xml: string;
  size: number;
  color?: string;
}) {
  const tintedXml = useMemo(
    () => (color ? tintFigmaIcon(xml, color) : xml),
    [xml, color],
  );

  return (
    <View style={{ width: size, height: size, overflow: "hidden" }}>
      <SvgXml xml={tintedXml} width={size} height={size} />
    </View>
  );
}

export function BearCashIaCloseIcon({ size = 24, color }: IconProps) {
  return <FigmaIcon xml={BEAR_CASH_IA_CLOSE_XML} size={size} color={color} />;
}

export function BearCashIaSendIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={BEAR_CASH_IA_SEND_XML} size={size} color={color} />;
}

export function BearCashIaChatIcon({ size = 24, color }: IconProps) {
  return <FigmaIcon xml={BEAR_CASH_IA_CHAT_XML} size={size} color={color} />;
}

export function BearCashIaPlusIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={BEAR_CASH_IA_PLUS_XML} size={size} color={color} />;
}
