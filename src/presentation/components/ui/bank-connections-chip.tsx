import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import type { OpenFinanceConnection } from "@/infra/http/services/api/modules/open-finance.module";
import {
  HomeChevronDownIcon,
  HomePlusIcon,
} from "@/presentation/components/ui/home-icons";
import { InstitutionMark } from "@/presentation/components/ui/institution-mark";
import {
  BearCashColors,
  BearCashTypography,
} from "@/presentation/constants/theme";
import { createThemedStyles } from "@/presentation/constants/themed-styles";
import { isAuthorisedConnection } from "@/presentation/open-finance/connect-bank";

const MARK_SIZE = 32;
const MARK_OVERLAP = 11;
const MAX_VISIBLE = 3;

type BankConnectionsChipProps = {
  connections: OpenFinanceConnection[];
  onPress?: () => void;
  filtered?: boolean;
};

function uniqueInstitutions(connections: OpenFinanceConnection[]) {
  const seen = new Set<string>();
  const result: OpenFinanceConnection[] = [];

  for (const connection of connections) {
    if (!isAuthorisedConnection(connection)) {
      continue;
    }
    const key = connection.institutionId || connection.institutionName;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(connection);
  }

  return result;
}

function DashedAddMark() {
  const styles = useStyles();
  return (
    <View style={styles.addMark}>
      <Svg width={MARK_SIZE} height={MARK_SIZE} style={StyleSheet.absoluteFill}>
        <Circle
          cx={MARK_SIZE / 2}
          cy={MARK_SIZE / 2}
          r={MARK_SIZE / 2 - 0.5}
          fill={BearCashColors.surface}
          stroke={BearCashColors.text}
          strokeWidth={1}
          strokeDasharray="2.4 1.8"
        />
      </Svg>
      <HomePlusIcon size={16} color={BearCashColors.text} />
    </View>
  );
}

export function BankConnectionsChip({
  connections,
  onPress,
  filtered = false,
}: BankConnectionsChipProps) {
  const styles = useStyles();
  const institutions = uniqueInstitutions(connections);
  const compact = institutions.length > 0;
  const markSize = compact ? 26 : MARK_SIZE;
  const overlap = compact ? 6 : MARK_OVERLAP;
  const maxVisible = compact ? 2 : MAX_VISIBLE;
  const visible = institutions.slice(0, maxVisible);
  const remaining = compact ? 0 : institutions.length - visible.length;
  const isEmpty = institutions.length === 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isEmpty
          ? "Adicionar conexão bancária"
          : "Conexões bancárias"
      }
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        compact && styles.chipCompact,
        pressed && styles.pressed,
      ]}
    >
      {isEmpty ? (
        <DashedAddMark />
      ) : (
        <View style={styles.stackWrap}>
          <View style={[styles.stack, { height: markSize }]}>
            {visible.map((connection, index) => (
              <View
                key={connection.institutionId || connection.id}
                style={[
                  styles.stackItem,
                  {
                    width: markSize,
                    height: markSize,
                    borderRadius: markSize / 2,
                    marginLeft: index === 0 ? 0 : -overlap,
                    zIndex: visible.length - index,
                    borderWidth: index === 0 ? 0 : 1,
                    borderColor: BearCashColors.background,
                  },
                ]}
              >
                <InstitutionMark
                  name={connection.institutionName}
                  logoUrl={connection.institutionLogoUrl}
                  size={markSize}
                />
              </View>
            ))}
            {remaining > 0 ? (
              <View
                style={[
                  styles.stackItem,
                  styles.more,
                  {
                    width: markSize,
                    height: markSize,
                    borderRadius: markSize / 2,
                    marginLeft: -overlap,
                    zIndex: 0,
                  },
                ]}
              >
                <Text style={styles.moreText}>+{remaining}</Text>
              </View>
            ) : null}
          </View>
          {filtered ? <View style={styles.notificationDot} /> : null}
        </View>
      )}
      <HomeChevronDownIcon
        size={compact ? 14 : 16}
        color={BearCashColors.text}
      />
    </Pressable>
  );
}

const useStyles = createThemedStyles(() => StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BearCashColors.surface,
    borderRadius: 36,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 6,
    overflow: "hidden",
  },
  chipCompact: {
    gap: 5,
    borderRadius: 28,
    paddingLeft: 6,
    paddingRight: 5,
    paddingVertical: 6,
  },
  pressed: {
    opacity: 0.85,
  },
  addMark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  stackWrap: {
    position: "relative",
  },
  stack: {
    flexDirection: "row",
    alignItems: "center",
    height: MARK_SIZE,
  },
  stackItem: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    borderRadius: MARK_SIZE / 2,
    overflow: "hidden",
  },
  more: {
    backgroundColor: BearCashColors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: {
    ...BearCashTypography.captionSmall,
    fontSize: 12,
    lineHeight: 15,
    color: BearCashColors.onText,
  },
  notificationDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: BearCashColors.warning,
    zIndex: 4,
  },
}));
