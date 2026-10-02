import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTouchable } from './ThemedTouchable';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface UpcomingJobItem {
  id: string;
  proName: string;
  trade: string;
  avatarUrl?: string;
  scheduledAt: string;
  statusText: string;
  statusType?: 'confirmed' | 'in_progress' | 'pending';
}

export const DEFAULT_UPCOMING_JOB: UpcomingJobItem = {
  id: 'job-1',
  proName: 'García Reformas & Obras',
  trade: 'Fontanería y Baños',
  avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
  scheduledAt: 'Lun, 18 Sep · 10:00 h',
  statusText: 'Confirmado',
  statusType: 'confirmed',
};

export interface UpcomingJobCardProps {
  title?: string;
  job?: UpcomingJobItem;
  onViewAll?: () => void;
  onPressJob?: (job: UpcomingJobItem) => void;
  onOptionsPress?: (job: UpcomingJobItem) => void;
}

export function UpcomingJobCard({
  title = 'Próximos trabajos',
  job = DEFAULT_UPCOMING_JOB,
  onViewAll,
  onPressJob,
  onOptionsPress,
}: UpcomingJobCardProps) {
  const { colors, isDark } = useAppTheme();

  const getStatusStyles = () => {
    switch (job.statusType) {
      case 'confirmed':
        return {
          bg: isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7',
          text: isDark ? '#4ADE80' : '#15803D',
        };
      case 'in_progress':
        return {
          bg: isDark ? 'rgba(56, 189, 248, 0.15)' : '#E0F2FE',
          text: isDark ? '#38BDF8' : '#0284C7',
        };
      case 'pending':
      default:
        return {
          bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
          text: isDark ? '#FBBF24' : '#B45309',
        };
    }
  };

  const statusStyle = getStatusStyles();

  return (
    <View style={styles.container}>
      {/* Header Row: Title + "Ver todos" */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {title}
        </Text>
        {onViewAll && (
          <ThemedTouchable
            onPress={onViewAll}
            haptic="light"
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.viewAllText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Ver todos
            </Text>
          </ThemedTouchable>
        )}
      </View>

      {/* Main Appointment Card */}
      <ThemedTouchable
        onPress={() => onPressJob?.(job)}
        haptic="light"
        scaleOnPress
        activeOpacity={0.92}
        style={[
          styles.cardWrapper,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderColor: isDark ? colors.border : '#E2E8F0',
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${job.proName}, ${job.trade}, para ${job.scheduledAt}`}
      >
        {/* Top Line: Avatar + Pro Info + Options Button */}
        <View style={styles.topInfoRow}>
          {job.avatarUrl ? (
            <Image
              source={{ uri: job.avatarUrl }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.avatarFallback,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                {job.proName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.nameContainer}>
            <Text
              style={[styles.proNameText, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {job.proName}
            </Text>
            <Text
              style={[styles.tradeText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {job.trade}
            </Text>
          </View>

          {onOptionsPress && (
            <ThemedTouchable
              onPress={() => onOptionsPress(job)}
              haptic="light"
              style={styles.moreButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Opciones del trabajo"
            >
              <Ionicons
                name="ellipsis-vertical"
                size={16}
                color={isDark ? '#94A3B8' : '#64748B'}
              />
            </ThemedTouchable>
          )}
        </View>

        {/* Bottom Line: Scheduled Date/Time + Status Pill */}
        <View style={styles.bottomLine}>
          <View style={styles.scheduleRow}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.scheduledDateText, { color: colors.textSecondary }]}>
              {job.scheduledAt}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
              {job.statusText}
            </Text>
          </View>
        </View>
      </ThemedTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  cardWrapper: {
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  nameContainer: {
    flex: 1,
    marginLeft: 12,
  },
  proNameText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: -0.2,
  },
  tradeText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Regular',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduledDateText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-Bold',
  },
});
