import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

import type { OpenFinanceConnection } from "@/infra/http/services/api/modules/open-finance.module";
import { Button } from "@/presentation/components/ui/button";
import { HomePlusIcon } from "@/presentation/components/ui/home-icons";
import { InstitutionMark } from "@/presentation/components/ui/institution-mark";
import { Sheet } from "@/presentation/components/ui/sheet";
import {
  BearCashColors,
  BearCashTypography,
} from "@/presentation/constants/theme";

const BANK_MARK_SIZE = 40;
const CHECKBOX_ON_XML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="2" y="2" width="16" height="16" rx="4" fill="#B385E0"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M14.5303 8.03039L9 13.5607L5.46967 10.0304L6.53033 8.96973L9 11.4394L13.4697 6.96973L14.5303 8.03039Z" fill="#212022"/>
</svg>`;

export type BankSelectSheetProps = {
  visible: boolean;
  connections: OpenFinanceConnection[];
  selectedIds?: string[];
  onClose: () => void;
  onSelect: (ids: string[]) => void;
  onAddAccount: () => void;
};

function bankKey(connection: OpenFinanceConnection) {
  return connection.institutionId || connection.id;
}

function uniqueActiveConnections(connections: OpenFinanceConnection[]) {
  const byInstitution = new Map<string, OpenFinanceConnection>();

  for (const connection of connections) {
    if (connection.revokedAt) {
      continue;
    }

    const key = bankKey(connection);
    const existing = byInstitution.get(key);
    if (!existing) {
      byInstitution.set(key, connection);
      continue;
    }

    const existingSynced = existing.lastSyncedAt
      ? Date.parse(existing.lastSyncedAt)
      : Date.parse(existing.updatedAt);
    const nextSynced = connection.lastSyncedAt
      ? Date.parse(connection.lastSyncedAt)
      : Date.parse(connection.updatedAt);

    if (nextSynced > existingSynced) {
      byInstitution.set(key, connection);
    }
  }

  return [...byInstitution.values()];
}

function formatLastSynced(iso: string | null) {
  if (!iso) {
    return "Atualizado agora";
  }

  const then = Date.parse(iso);
  if (Number.isNaN(then)) {
    return "Atualizado agora";
  }

  const diffMin = Math.max(0, Math.floor((Date.now() - then) / 60_000));
  if (diffMin < 1) {
    return "Atualizado agora";
  }
  if (diffMin === 1) {
    return "Atualizado há 1 minuto";
  }
  if (diffMin < 60) {
    return `Atualizado há ${diffMin} minutos`;
  }

  const hours = Math.floor(diffMin / 60);
  if (hours === 1) {
    return "Atualizado há 1 hora";
  }
  if (hours < 24) {
    return `Atualizado há ${hours} horas`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) {
    return "Atualizado há 1 dia";
  }
  return `Atualizado há ${days} dias`;
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={styles.checkboxOuter} accessibilityState={{ checked }}>
      {checked ? (
        <View style={styles.checkboxOn}>
          <SvgXml xml={CHECKBOX_ON_XML} width={20} height={20} />
        </View>
      ) : (
        <View style={styles.checkboxBox}>
          <View style={styles.checkboxInner} />
        </View>
      )}
    </View>
  );
}

export function BankSelectSheet({
  visible,
  connections,
  selectedIds = [],
  onClose,
  onSelect,
  onAddAccount,
}: BankSelectSheetProps) {
  const banks = useMemo(
    () => uniqueActiveConnections(connections),
    [connections],
  );
  const [draftIds, setDraftIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!visible) {
      return;
    }

    const allowed = new Set(banks.map((bank) => bankKey(bank)));
    const next = selectedIds.filter((id) => allowed.has(id));
    setDraftIds(
      new Set(next.length > 0 ? next : banks.map((bank) => bankKey(bank))),
    );
  }, [banks, selectedIds, visible]);

  const canConfirm = draftIds.size > 0 && banks.length > 0;

  function toggleBank(id: string) {
    setDraftIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Selecionar banco"
      subtitle="Selecione o banco cujos dados deseja visualizar"
      contentStyle={styles.sheet}
    >
      {banks.length === 0 ? (
        <Text style={styles.emptyMessage}>
          Você não conectou nenhum banco ainda
        </Text>
      ) : (
        <View style={styles.list}>
          {banks.map((bank) => {
            const id = bankKey(bank);
            const checked = draftIds.has(id);

            return (
              <Pressable
                key={id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel={bank.institutionName}
                onPress={() => toggleBank(id)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <Checkbox checked={checked} />
                <InstitutionMark
                  name={bank.institutionName}
                  logoUrl={bank.institutionLogoUrl}
                  size={BANK_MARK_SIZE}
                />
                <View style={styles.copy}>
                  <Text style={styles.bankName} numberOfLines={1}>
                    {bank.institutionName}
                  </Text>
                  <Text style={styles.updated}>
                    {formatLastSynced(bank.lastSyncedAt)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.actions}>
        {banks.length > 0 ? (
          <Button
            label="Selecionar"
            variant="filled"
            disabled={!canConfirm}
            style={styles.selectButton}
            onPress={() => onSelect([...draftIds])}
          />
        ) : null}
        <Button
          label="Adicionar nova conta"
          variant="stroke"
          rightIcon={<HomePlusIcon size={16} color={BearCashColors.text} />}
          onPress={onAddAccount}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 16,
    gap: 24,
  },
  list: {
    alignSelf: "stretch",
    gap: 16,
  },
  emptyMessage: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.textSoft,
    alignSelf: "stretch",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  bankName: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.text,
  },
  updated: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.textSoft,
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: {
    width: 20,
    height: 20,
    overflow: "hidden",
  },
  checkboxBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: BearCashColors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxInner: {
    width: 13,
    height: 13,
    borderRadius: 2.6,
    backgroundColor: BearCashColors.background,
  },
  actions: {
    alignSelf: "stretch",
    gap: 16,
  },
  selectButton: {
    backgroundColor: "#e0dfe2",
  },
});
