import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { LegalScreen } from '@/components/profile/LegalScreen';
import { CustomAlert } from '@/components/ui/CustomAlert';

export default function LegalRoute() {
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
    <>
      <LegalScreen
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
    </>
  );
}
