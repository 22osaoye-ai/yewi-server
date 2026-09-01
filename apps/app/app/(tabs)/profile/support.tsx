import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { SupportScreen } from '@/components/profile/SupportScreen';
import { CustomAlert } from '@/components/ui/CustomAlert';

export default function SupportRoute() {
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
      <SupportScreen
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
