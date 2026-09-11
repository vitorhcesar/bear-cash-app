import { StyleSheet, Text, View } from "react-native";

import type { OpenFinanceConnection } from "@/infra/http/services/api/modules/open-finance.module";
import { InstitutionMark } from "@/presentation/components/ui/institution-mark";
import {
  BearCashColors,
  BearCashTypography,
} from "@/presentation/constants/theme";

const DEFAULT_SIZE = 20;
const DEFAULT_OVERLAP = 5;

type BankMarkStackProps = {
  connections: OpenFinanceConnection[];
  size?: number;
  overlap?: number;
  maxVisible?: number;
};

export function BankMarkStack({
  connections,
  size = DEFAULT_SIZE,
  overlap = DEFAULT_OVERLAP,
  maxVisible = 3,
}: BankMarkStackProps) {
  const visible = connections.slice(0, maxVisible);
  const remaining = connections.length - visible.length;

  if (connections.length === 0) {
    return null;
  }

  return (
    <View style={[styles.stack, { height: size }]}>
      {visible.map((connection, index) => (
        <View
          key={connection.institutionId || connection.id}
          style={[
            styles.item,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
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
            size={size}
          />
        </View>
      ))}
      {remaining > 0 ? (
        <View
          style={[
            styles.item,
            styles.more,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -overlap,
              zIndex: 0,
            },
          ]}
        >
          <Text style={styles.moreText}>+{remaining}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    flexDirection: "row",
    alignItems: "center",
  },
  item: {
    overflow: "hidden",
  },
  more: {
    backgroundColor: BearCashColors.text,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BearCashColors.background,
  },
  moreText: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.buttonFilledText,
  },
});
