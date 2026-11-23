import { ReactNode, useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { FONTS, PALETTE, RADII } from '@/theme/tokens';

interface Props {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  trailing?: ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  trailing,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
}: Props) {
  const [focus, setFocus] = useState(false);
  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.box, { borderColor: focus ? PALETTE.ink : PALETTE.line }]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={`${PALETTE.inkSoft}88`}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={styles.input}
        />
        {trailing}
      </View>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: PALETTE.inkSoft,
    marginBottom: 8,
  },
  box: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: RADII.chip,
    backgroundColor: PALETTE.paper,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: PALETTE.ink,
    height: '100%',
  },
  hint: {
    fontSize: 12,
    color: PALETTE.inkSoft,
    marginTop: 6,
    lineHeight: 18,
  },
});
