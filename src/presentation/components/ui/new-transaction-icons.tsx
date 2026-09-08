import { useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import {
  TRANSACTION_CALENDAR_XML,
  TRANSACTION_CARD_XML,
  TRANSACTION_CHEVRON_DOWN_XML,
  TRANSACTION_CHEVRON_RIGHT_XML,
  TRANSACTION_PENCIL_XML,
  TRANSACTION_TRASH_XML,
  TRANSACTION_EYE_XML,
} from '@/presentation/components/ui/new-transaction-icon-xml';

type IconProps = {
  size?: number;
  color?: string;
};

function tintFigmaIcon(xml: string, color: string) {
  return xml.replace(/#(?:E0E2DF|585D56)/gi, color);
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
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <SvgXml xml={tintedXml} width={size} height={size} />
    </View>
  );
}

export function TransactionCalendarIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={TRANSACTION_CALENDAR_XML} size={size} color={color} />;
}

export function TransactionChevronDownIcon({ size = 16, color }: IconProps) {
  return (
    <FigmaIcon xml={TRANSACTION_CHEVRON_DOWN_XML} size={size} color={color} />
  );
}

export function TransactionPencilIcon({ size = 24, color }: IconProps) {
  return <FigmaIcon xml={TRANSACTION_PENCIL_XML} size={size} color={color} />;
}

export function TransactionChevronRightIcon({ size = 24, color }: IconProps) {
  return (
    <FigmaIcon xml={TRANSACTION_CHEVRON_RIGHT_XML} size={size} color={color} />
  );
}

export function TransactionCardIcon({ size = 24, color }: IconProps) {
  return <FigmaIcon xml={TRANSACTION_CARD_XML} size={size} color={color} />;
}

export function TransactionTrashIcon({ size = 16, color }: IconProps) {
  return <FigmaIcon xml={TRANSACTION_TRASH_XML} size={size} color={color} />;
}

export function TransactionEyeIcon({ size = 12, color }: IconProps) {
  return <FigmaIcon xml={TRANSACTION_EYE_XML} size={size} color={color} />;
}
