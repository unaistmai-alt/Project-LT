import React from 'react';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  NotoSansMalayalam_400Regular,
  NotoSansMalayalam_500Medium,
  NotoSansMalayalam_600SemiBold,
  NotoSansMalayalam_700Bold,
} from '@expo-google-fonts/noto-sans-malayalam';
import { StoreProvider, useTheme } from './lib/store';
import RootNavigator from './navigation/RootNavigator';

function Shell() {
  const { mode } = useTheme();
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
    NotoSansMalayalam_400Regular,
    NotoSansMalayalam_500Medium,
    NotoSansMalayalam_600SemiBold,
    NotoSansMalayalam_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
