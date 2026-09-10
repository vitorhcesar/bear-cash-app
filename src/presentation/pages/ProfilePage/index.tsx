import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/infra/http/get-error-message';
import { useAuthSession } from '@/presentation/auth/auth-session-context';
import { LgpdCheckIcon } from '@/presentation/components/ui/auth-icons';
import { BackButton } from '@/presentation/components/ui/back-button';
import { DeleteAccountSheet } from '@/presentation/components/ui/delete-account-sheet';
import {
  TrashIcon,
  VerifiedBadgeIcon,
} from '@/presentation/components/ui/profile-icons';
import { TextField } from '@/presentation/components/ui/text-field';
import { BearCashColors, BearCashTypography } from '@/presentation/constants/theme';

function formatBirthDateDisplay(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
  }

  const digits = value.replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  return value;
}

/** Masks CPF as 000.****.***-25 (keeps first 3 and last 2 digits). */
function maskCpf(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const digits = value.replace(/\D/g, '');
  if (digits.length < 5) {
    return digits || '—';
  }

  return `${digits.slice(0, 3)}.****.***-${digits.slice(-2)}`;
}

function formatPhoneDisplay(phone: string | null | undefined) {
  if (!phone) {
    return '—';
  }

  const digits = phone.replace(/\D/g, '');
  const national =
    digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;

  if (national.length === 11) {
    return `+55 ${national.slice(0, 2)} ${national.slice(2, 7)}-${national.slice(7)}`;
  }

  if (national.length === 10) {
    return `+55 ${national.slice(0, 2)} ${national.slice(2, 6)}-${national.slice(6)}`;
  }

  return phone.startsWith('+') ? phone : `+${digits}`;
}

export function ProfilePage() {
  const { profile, user, deleteAccount } = useAuthSession();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fullName =
    profile?.fullName?.trim() || user?.name?.trim() || '—';
  const birthDate = formatBirthDateDisplay(profile?.birthDate);
  const cpf = maskCpf(profile?.cpf);
  const email = user?.email?.trim() || '—';
  const phone = formatPhoneDisplay(user?.phoneNumber);
  const phoneVerified = Boolean(user?.phoneNumberVerified);
  const emailVerified = Boolean(user?.emailVerified);

  const verifiedBadge = useMemo(
    () => <VerifiedBadgeIcon size={16} color={BearCashColors.primary} />,
    [],
  );

  function handleDeleteAccount() {
    setDeleteOpen(true);
  }

  async function confirmDeleteAccount() {
    if (deleting) {
      return;
    }

    setDeleting(true);
    try {
      await deleteAccount();
    } catch (error) {
      Alert.alert(
        'Erro',
        getErrorMessage(
          error,
          'Não foi possível excluir a conta. Tente novamente.',
        ),
      );
      setDeleting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Perfil</Text>
            <Text style={styles.subtitle}>Edite suas informações pessoais</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações pessoais</Text>
          <View style={styles.fields}>
            <TextField
              label="Nome completo"
              value={fullName}
              editable={false}
              appearance="static"
            />
            <TextField
              label="Data de nascimento"
              value={birthDate}
              editable={false}
              appearance="static"
            />
            <TextField
              label="CPF"
              value={cpf}
              editable={false}
              appearance="static"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações de contato</Text>
          <View style={styles.fields}>
            <TextField
              label="E-mail"
              value={email}
              editable={false}
              appearance="static"
              trailing={emailVerified ? verifiedBadge : undefined}
            />
            <TextField
              label="WhatsApp"
              value={phone}
              editable={false}
              appearance="static"
              trailing={phoneVerified ? verifiedBadge : undefined}
            />
          </View>
        </View>

        <View style={styles.securityRow}>
          <LgpdCheckIcon size={16} />
          <Text style={styles.securityText}>
            Dados seguros pela LGPD com criptografia
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleDeleteAccount}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.deleteLabel}>Excluir conta</Text>
          <TrashIcon size={12} color={BearCashColors.textSoft} />
        </Pressable>
      </ScrollView>

      <DeleteAccountSheet
        visible={deleteOpen}
        loading={deleting}
        onClose={() => {
          if (!deleting) {
            setDeleteOpen(false);
          }
        }}
        onConfirm={() => {
          void confirmDeleteAccount();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BearCashColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  headerCopy: {
    gap: 8,
  },
  title: {
    ...BearCashTypography.h1,
    color: BearCashColors.text,
  },
  subtitle: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    ...BearCashTypography.subheading,
    color: BearCashColors.text,
  },
  fields: {
    gap: 16,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  securityText: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  deleteButton: {
    marginTop: 'auto',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  deleteLabel: {
    ...BearCashTypography.caption,
    color: BearCashColors.textSoft,
  },
  pressed: {
    opacity: 0.85,
  },
});
