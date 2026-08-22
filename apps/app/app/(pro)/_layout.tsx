import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { CustomBottomTab } from '../../src/components/CustomBottomTab';
import { FloatingActionButton } from '../../src/components/FloatingActionButton';

export default function ProTabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <CustomBottomTab {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="opportunities"
          options={{
            title: 'Leads',
          }}
        />
        <Tabs.Screen
          name="gigs"
          options={{
            title: 'Mis Gigs',
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Trabajos',
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: 'Billetera',
          }}
        />
      </Tabs>

      {/* Floating Action Button (Moggo Style) */}
      <FloatingActionButton />
    </View>
  );
}
