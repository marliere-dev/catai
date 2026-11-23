import { Platform } from 'react-native';

// Animated.useNativeDriver não funciona em web (react-native-web ignora e
// avisa no console). Centraliza a flag pra todas as animações.
export const NATIVE_DRIVER = Platform.OS !== 'web';
