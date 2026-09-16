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

const MARK_SIZE = 28;
const MARK_OVERLAP = 10;
const MAX_VISIBLE = 3;

type BankConnectionsChipProps = {
  connections: OpenFinanceConnection[];
  onPress?: () => void;
};

function uniqueInstitutions(connections: OpenFinanceConnection[]) {
  const seen = new Set<string>();
  const result: OpenFinanceConnection[] = [];

  for (const connection of connections) {
    if (connection.revokedAt || connection.status !== "AUTHORISED") {
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
      <HomePlusIcon size={14} color={BearCashColors.text} />
    </View>
  );
}

export function BankConnectionsChip({
  connections,
  onPress,
}: BankConnectionsChipProps) {
  const styles = useStyles();
  const institutions = uniqueInstitutions(connections);
  const visible = institutions.slice(0, MAX_VISIBLE);
  const remaining = institutions.length - visible.length;
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
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      {isEmpty ? (
        <DashedAddMark />
      ) : (
        <View style={styles.stack}>
          {visible.map((connection, index) => (
            <View
              key={connection.institutionId || connection.id}
              style={[
                styles.stackItem,
                {
                  marginLeft: index === 0 ? 0 : -MARK_OVERLAP,
                  zIndex: visible.length - index,
                },
              ]}
            >
              <InstitutionMark
                name={connection.institutionName}
                logoUrl={connection.institutionLogoUrl}
                size={MARK_SIZE}
              />
            </View>
          ))}
          {remaining > 0 ? (
            <View
              style={[
                styles.stackItem,
                styles.more,
                { marginLeft: -MARK_OVERLAP, zIndex: 0 },
              ]}
            >
              <Text style={styles.moreText}>+{remaining}</Text>
            </View>
          ) : null}
        </View>
      )}
      <HomeChevronDownIcon size={16} color={BearCashColors.text} />
    </Pressable>
  );
}

const useStyles = createThemedStyles(() => StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BearCashColors.surface,
    borderRadius: 32,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 6,
    overflow: "hidden",
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
    fontSize: 11,
    lineHeight: 14,
    color: BearCashColors.onText,
  },
}));
