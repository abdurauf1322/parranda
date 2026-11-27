import React from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, CheckSquare, Boxes, MessageSquare, Menu } from 'lucide-react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { TopBar } from './src/components/TopBar';
import { LoginScreen } from './src/screens/LoginScreen';
import { AsosiyScreen } from './src/screens/AsosiyScreen';
import { TopshiriqlarScreen } from './src/screens/TopshiriqlarScreen';
import { OmborVaznScreen } from './src/screens/OmborVaznScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { KoproqScreen } from './src/screens/KoproqScreen';
import { COLORS } from './src/theme';

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <TopBar />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.bg,
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textDim,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        }}
      >
        <Tab.Screen
          name="Asosiy"
          component={AsosiyScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Topshiriqlar"
          component={TopshiriqlarScreen}
          options={{
            tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="OmborVazn"
          component={OmborVaznScreen}
          options={{
            title: 'Ombor & Vazn',
            tabBarIcon: ({ color, size }) => <Boxes color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Koproq"
          component={KoproqScreen}
          options={{
            title: 'Ko‘proq',
            tabBarIcon: ({ color, size }) => <Menu color={color} size={size} />,
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <LoginScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <StatusBar barStyle="light-content" />
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
