import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/store';
import { F } from '../lib/theme';
import WelcomeScreen from '../screens/WelcomeScreen';
import TouchScreen from '../screens/TouchScreen';
import MemoriesScreen from '../screens/MemoriesScreen';
import PairScreen from '../screens/PairScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FloatingHearts from '../components/FloatingHearts';
import { useStore } from '../lib/store';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: F.semibold,
          fontSize: 11,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            Touch: focused ? 'heart' : 'heart-outline',
            Memories: focused ? 'time' : 'time-outline',
            Pair: focused ? 'link' : 'link-outline',
            Settings: focused ? 'settings' : 'settings-outline',
          };
          return <Ionicons name={map[route.name] ?? 'ellipse'} size={size - 2} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Touch" component={TouchScreen} options={{ title: 'സ്പർശം' }} />
      <Tab.Screen name="Memories" component={MemoriesScreen} options={{ title: 'ഓർമ്മകൾ' }} />
      <Tab.Screen name="Pair" component={PairScreen} options={{ title: 'കണക്ഷൻ' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'ക്രമീകരണം' }} />
    </Tab.Navigator>
  );
}

function Splash() {
  const { colors, dark } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FloatingHearts color={dark ? '#FF6B94' : '#FF8FAC'} opacity={0.3} />
      <SafeAreaView style={styles.splash}>
        <View style={styles.splashLogo}>
          <Ionicons name="heart" size={46} color="#FFFFFF" />
        </View>
        <Text style={[styles.splashTitle, { color: colors.primary }]}>Lovetouch</Text>
        <Text style={[styles.splashSub, { color: colors.sub }]}>ഒരുമിപ്പിക്കുന്നു...</Text>
      </SafeAreaView>
    </View>
  );
}

export default function RootNavigator() {
  const { colors, mode } = useTheme();
  const { hydrated, room } = useStore();

  const navTheme = {
    ...(mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bg,
      card: colors.card,
      text: colors.text,
      primary: colors.primary,
      border: colors.border,
    },
  };

  if (!hydrated) return <Splash />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        {room ? (
          <Stack.Screen name="Tabs" component={Tabs} />
        ) : (
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FF4D80',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4D80',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    marginBottom: 18,
  },
  splashTitle: {
    fontFamily: F.bold,
    fontSize: 32,
  },
  splashSub: {
    fontFamily: F.regular,
    fontSize: 14,
    marginTop: 6,
  },
});
