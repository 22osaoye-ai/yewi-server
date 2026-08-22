import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { CustomBottomTab } from '../../src/components/CustomBottomTab';
import { FloatingActionButton } from '../../src/components/FloatingActionButton';

export default function ClientTabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <CustomBottomTab {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Inicio',
          }}
        />
        <Tabs.Screen
          name="requests"
          options={{
            title: 'Solicitudes',
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Pedidos',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
          }}
        />
      </Tabs>

      {/* Floating Action Button (Moggo Style) */}
      <FloatingActionButton />
    </View>
  );
}
