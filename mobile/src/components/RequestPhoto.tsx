// Mostra a foto enviada pra um pedido. Em caso de URL ausente, falha de rede
// ou modo memory do backend (URL inválida), cai pro PhotoPlaceholder do design.

import { Image, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { PhotoPlaceholder } from './PhotoPlaceholder';

interface Props {
  uri: string | null | undefined;
  label?: string;
  height?: number;
  radius?: number;
}

export function RequestPhoto({ uri, label = 'foto', height = 200, radius = 16 }: Props) {
  const [errored, setErrored] = useState(false);

  if (!uri || errored) {
    return <PhotoPlaceholder label={label} height={height} radius={radius} />;
  }

  return (
    <View style={[styles.wrap, { height, borderRadius: radius }]}>
      <Image
        source={{ uri }}
        style={styles.image}
        resizeMode="cover"
        onError={() => setErrored(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
