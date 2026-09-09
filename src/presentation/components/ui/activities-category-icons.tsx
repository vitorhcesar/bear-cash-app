import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { CATEGORY_ICON_XML } from "@/presentation/components/ui/activities-category-icon-xml";
import { BearCashColors } from "@/presentation/constants/theme";

const PARENT_GLYPH = "#212220";
const CLIP_FILL = /fill="(?:white|#fff(?:fff)?)"/gi;
const tintCache = new Map<string, string>();

function tintCategoryXml(xml: string, color: string) {
  return xml
    .replace(CLIP_FILL, 'fill="__CLIP__"')
    .replace(/stroke="#[^"]+"/gi, `stroke="${color}"`)
    .replace(/fill="#[^"]+"/gi, `fill="${color}"`)
    .replace(/fill="__CLIP__"/g, 'fill="white"');
}

function getTintedXml(iconKey: string, color: string) {
  const cacheKey = `${iconKey}:${color}`;
  const cached = tintCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const source = CATEGORY_ICON_XML[iconKey];
  if (!source) {
    return undefined;
  }

  const tinted = tintCategoryXml(source, color);
  tintCache.set(cacheKey, tinted);
  return tinted;
}

const CategoryGlyph = memo(function CategoryGlyph({
  iconKey,
  color,
  size = 12,
}: {
  iconKey: string;
  color: string;
  size?: number;
}) {
  const xml = useMemo(() => getTintedXml(iconKey, color), [iconKey, color]);

  if (!xml) {
    return <View style={{ width: size, height: size }} />;
  }

  return (
    <View style={{ width: size, height: size, overflow: "hidden" }}>
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
});

export const CategoryChipIcon = memo(function CategoryChipIcon({
  iconKey,
  color,
  size = 12,
}: {
  iconKey: string;
  color: string;
  size?: number;
}) {
  return <CategoryGlyph iconKey={iconKey} color={color} size={size} />;
});

export const CategoryParentIcon = memo(function CategoryParentIcon({
  iconKey,
  color,
}: {
  iconKey: string;
  color: string;
}) {
  return (
    <View style={[styles.box, { backgroundColor: color }]}>
      <CategoryGlyph iconKey={iconKey} color={PARENT_GLYPH} size={12} />
    </View>
  );
});

export const CategoryChildIcon = memo(function CategoryChildIcon({
  iconKey,
  color,
}: {
  iconKey: string;
  color: string;
}) {
  return (
    <View style={[styles.box, styles.childBox]}>
      <CategoryGlyph iconKey={iconKey} color={color} size={12} />
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    width: 24,
    height: 24,
    borderRadius: 8,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  childBox: {
    backgroundColor: BearCashColors.borderSoft,
  },
});
