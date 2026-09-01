import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchable } from '@/components/ui/ThemedTouchable';
import { CustomSwitch } from '@/components/ui/CustomSwitch';

interface ProfilePhotoModalProps {
  visible: boolean;
  isOnline: boolean;
  hasPhoto?: boolean;
  onClose: () => void;
  onToggleOnline: (value: boolean) => void;
  onSelectFromGallery: () => void;
  onTakePhoto: () => void;
  onRemovePhoto?: () => void;
}

export function ProfilePhotoModal({
  visible,
  isOnline,
  hasPhoto = false,
  onClose,
  onToggleOnline,
  onSelectFromGallery,
  onTakePhoto,
  onRemovePhoto,
}: ProfilePhotoModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: '#18181B',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            padding: 24,
            paddingBottom: 40,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle Bar */}
          <View
            style={{
              width: 48,
              height: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignSelf: 'center',
              marginBottom: 20,
            }}
          />

          <Text
            style={{
              fontSize: 18,
              fontFamily: 'Satoshi-Black',
              color: '#FFFFFF',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            Foto de Perfil y Estado
          </Text>

          {/* Option 1: Gallery */}
          <ThemedTouchable
            onPress={onSelectFromGallery}
            haptic="selection"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Ionicons
              name="images-outline"
              size={22}
              color="#C87D20"
              style={{ marginRight: 16 }}
            />
            <Text
              style={{
                fontSize: 15.5,
                fontFamily: 'Satoshi-Bold',
                color: '#FFFFFF',
                flex: 1,
              }}
            >
              Elegir de la galería
            </Text>
          </ThemedTouchable>

          {/* Option 2: Camera */}
          <ThemedTouchable
            onPress={onTakePhoto}
            haptic="selection"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Ionicons
              name="camera-outline"
              size={22}
              color="#C87D20"
              style={{ marginRight: 16 }}
            />
            <Text
              style={{
                fontSize: 15.5,
                fontFamily: 'Satoshi-Bold',
                color: '#FFFFFF',
                flex: 1,
              }}
            >
              Tomar foto con la cámara
            </Text>
          </ThemedTouchable>

          {/* Option 3: Remove Photo (if exists) */}
          {hasPhoto && onRemovePhoto && (
            <ThemedTouchable
              onPress={onRemovePhoto}
              haptic="medium"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Ionicons
                name="trash-outline"
                size={22}
                color="#EF4444"
                style={{ marginRight: 16 }}
              />
              <Text
                style={{
                  fontSize: 15.5,
                  fontFamily: 'Satoshi-Bold',
                  color: '#EF4444',
                  flex: 1,
                }}
              >
                Eliminar foto actual
              </Text>
            </ThemedTouchable>
          )}

          {/* Option 4: Online Status Switch Toggle */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 14,
            }}
          >
            <View className="flex-row items-center flex-1 mr-3">
              <Ionicons
                name="radio-button-on"
                size={22}
                color={isOnline ? '#10B981' : '#9CA3AF'}
                style={{ marginRight: 16 }}
              />
              <Text
                style={{
                  fontSize: 15.5,
                  fontFamily: 'Satoshi-Bold',
                  color: '#FFFFFF',
                }}
              >
                Estado en línea
              </Text>
            </View>
            <CustomSwitch
              value={isOnline}
              onValueChange={onToggleOnline}
              activeColor="#10B981"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default ProfilePhotoModal;
