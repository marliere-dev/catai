import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CataiApiError } from '@/api/client';
import { requestsApi } from '@/api/requests';
import { Button, Chip, LocationPicker, RequestPhoto, ScreenShell, TopBar } from '@/components';
import { RIcon } from '@/icons/RIcon';
import { notify } from '@/lib/dialog';
import { optimizeImage } from '@/lib/imageOptimize';
import { ALL_MATERIALS, ALL_QUANTITIES } from '@/lib/labels';
import { FONTS, PALETTE } from '@/theme/tokens';
import type { MaterialType, QuantityEstimate } from '@/types/api';

export default function Nova() {
  const router = useRouter();
  const [tipo, setTipo] = useState<MaterialType>('CARDBOARD');
  const [qtd, setQtd] = useState<QuantityEstimate>('MEDIUM');
  const [obs, setObs] = useState('');
  const [photo, setPhoto] = useState<{
    uri: string;
    name: string;
    type: 'image/jpeg' | 'image/webp';
  } | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const onCoordsChange = useCallback(
    (next: { latitude: number; longitude: number }) => setCoords(next),
    [],
  );

  const pickPhoto = async () => {
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    try {
      const optimized = await optimizeImage(a.uri);
      setPhoto({
        uri: optimized.uri,
        name: (a.fileName ?? 'foto').replace(/\.[^.]+$/, '') + '.jpg',
        type: optimized.type,
      });
    } catch (err) {
      notify('Erro ao processar foto', (err as Error).message);
    }
  };

  const submit = async () => {
    if (!photo) {
      notify('Adiciona uma foto', 'O backend exige uma imagem ao publicar.');
      return;
    }
    if (!coords) {
      notify('Aguarda o mapa carregar', 'A localização ainda está sendo definida.');
      return;
    }
    setBusy(true);
    try {
      await requestsApi.create({
        materialType: tipo,
        quantityEstimate: qtd,
        notes: obs.trim() || undefined,
        latitude: coords.latitude,
        longitude: coords.longitude,
        image: photo,
      });
      router.replace('/minhas');
    } catch (err) {
      const message =
        err instanceof CataiApiError ? err.message : ((err as Error).message ?? 'Erro');
      notify('Não foi possível publicar', message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenShell>
      <TopBar title="Nova solicitação" onBack={() => router.back()} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16 }}
      >
        <Section label="Tipo de reciclável">
          <View style={styles.chipsWrap}>
            {ALL_MATERIALS.map((t) => (
              <Chip key={t.id} active={tipo === t.id} onPress={() => setTipo(t.id)} icon={t.icon}>
                {t.label}
              </Chip>
            ))}
          </View>
        </Section>

        <Section label="Quantidade">
          <View style={styles.qtdRow}>
            {ALL_QUANTITIES.map((q, idx) => {
              const on = qtd === q.id;
              const swatch = idx === 0 ? 14 : idx === 1 ? 22 : 30;
              return (
                <Pressable
                  key={q.id}
                  onPress={() => setQtd(q.id)}
                  style={[
                    styles.qtdBtn,
                    {
                      backgroundColor: on ? PALETTE.ink : PALETTE.paper,
                      borderColor: on ? PALETTE.ink : PALETTE.line,
                    },
                  ]}
                >
                  <View
                    style={[
                      {
                        width: swatch + 18,
                        height: swatch + 14,
                        borderRadius: 8,
                        backgroundColor: on ? PALETTE.sage : PALETTE.soft,
                      },
                    ]}
                  />
                  <Text style={[styles.qtdLabel, { color: on ? PALETTE.paper : PALETTE.ink }]}>
                    {q.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section label="Observação" optional>
          <TextInput
            value={obs}
            onChangeText={setObs}
            multiline
            numberOfLines={3}
            placeholder="ex: retirar pelos fundos, portão azul"
            placeholderTextColor={`${PALETTE.inkSoft}88`}
            style={styles.textarea}
          />
        </Section>

        <Section label="Foto">
          {photo ? (
            <View style={{ position: 'relative' }}>
              <RequestPhoto uri={photo.uri} label="foto" height={180} radius={18} />
              <Pressable onPress={pickPhoto} style={styles.changeBtn}>
                <Text style={styles.changeBtnText}>trocar</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={pickPhoto} style={styles.photoBtn}>
              <View style={styles.photoBtnIcon}>
                <RIcon name="camera" size={22} color={PALETTE.sageDeep} />
              </View>
              <Text style={styles.photoBtnText}>Tirar foto</Text>
            </Pressable>
          )}
        </Section>

        <Section label="Localização">
          <LocationPicker height={220} radius={18} onChange={onCoordsChange} />
          <Text style={styles.hint}>arrasta o mapa pra ajustar o pino no centro</Text>
        </Section>
        <View style={{ height: 12 }} />
      </ScrollView>
      <View style={styles.footer}>
        <Button variant="primary" onPress={submit} disabled={busy}>
          {busy ? 'Publicando…' : 'Publicar solicitação'}
        </Button>
      </View>
    </ScreenShell>
  );
}

interface SectionProps {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}

function Section({ label, optional, children }: SectionProps) {
  return (
    <View style={{ marginBottom: 22 }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{label}</Text>
        {optional && <Text style={styles.sectionOptional}>opcional</Text>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: PALETTE.ink,
    letterSpacing: 0.1,
  },
  sectionOptional: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: PALETTE.inkSoft,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  qtdRow: {
    flexDirection: 'row',
    gap: 10,
  },
  qtdBtn: {
    flex: 1,
    height: 110,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  qtdLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
  },
  textarea: {
    minHeight: 88,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderWidth: 1.5,
    borderColor: PALETTE.line,
    backgroundColor: PALETTE.paper,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: PALETTE.ink,
    textAlignVertical: 'top',
  },
  photoBtn: {
    width: '100%',
    minHeight: 140,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: PALETTE.rule,
    borderStyle: 'dashed',
    backgroundColor: PALETTE.soft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoBtnIcon: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: PALETTE.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: PALETTE.ink,
  },
  changeBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: PALETTE.ink,
    borderRadius: 999,
    height: 32,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeBtnText: {
    color: PALETTE.paper,
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
  },
  hint: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: PALETTE.inkSoft,
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: PALETTE.line,
    backgroundColor: PALETTE.paper,
  },
});
