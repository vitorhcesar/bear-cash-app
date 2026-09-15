import { useMemo } from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";

import { tintSvgXml } from "@/presentation/components/ui/tint-svg-xml";
import { BearCashColors } from "@/presentation/constants/theme";
import { useBearCashTheme } from "@/presentation/theme/bear-cash-theme-context";

export type FigmaSvgIconProps = {
  xml: string;
  size: number;
  color?: string;
  glyphWidth?: number;
  glyphHeight?: number;
  box?: number;
  /** Skip recoloring (brand/full-color assets). */
  tint?: boolean;
};

export function useIconColor(color?: string) {
  useBearCashTheme();
  return color ?? BearCashColors.text;
}

export function FigmaSvgIcon({
  xml,
  size,
  color,
  glyphWidth,
  glyphHeight,
  box,
  tint = true,
}: FigmaSvgIconProps) {
  const { scheme } = useBearCashTheme();
  const resolvedColor = color ?? BearCashColors.text;
  const mode = color ? "all" : "neutral";

  const tintedXml = useMemo(() => {
    if (!tint) {
      return xml;
    }
    return tintSvgXml(xml, resolvedColor, mode, BearCashColors.onText);
  }, [xml, resolvedColor, mode, tint, scheme]);

  const hasLeaf = glyphWidth != null && glyphHeight != null;
  const scale = hasLeaf ? size / (box ?? size) : 1;
  const drawWidth = hasLeaf ? glyphWidth * scale : size;
  const drawHeight = hasLeaf ? glyphHeight * scale : size;

  return (
    <View
      style={{
        width: size,
        height: size,
        overflow: "hidden",
        alignItems: hasLeaf ? "center" : undefined,
        justifyContent: hasLeaf ? "center" : undefined,
      }}
    >
      <SvgXml
        key={`${scheme}:${resolvedColor}:${mode}:${tint ? "on" : "off"}`}
        xml={tintedXml}
        width={drawWidth}
        height={drawHeight}
      />
    </View>
  );
}
