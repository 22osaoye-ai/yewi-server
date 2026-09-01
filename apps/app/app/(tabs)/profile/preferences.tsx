import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { PreferencesScreen } from '@/components/profile/PreferencesScreen';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function PreferencesRoute() {
  const router = useRouter();
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  return (
    <ProtectedRoute fallbackMessage="Inicia sesión para personalizar tus preferencias de la aplicación.">
      <PreferencesScreen
        onBack={() => router.back()}
        onShowAlert={(title, message) =>
          setAlertConfig({ visible: true, title, message })
        }
      />
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttonText="Done"
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </ProtectedRoute>
  );
}
