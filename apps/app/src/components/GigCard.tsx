import { useRouter } from 'expo-router';
import {
  Bookmark,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Star,
  Zap,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CachedImage } from './CachedImage';
import { Gig } from '../types';
import { Colors, Shadows, Typography } from './Theme';

interface GigCardProps {
  gig: Gig;
  compact?: boolean;
  layout?: 'grid' | 'full';
}

export const GigCard: React.FC<GigCardProps> = ({
  gig,
  compact = false,
  layout = 'full',
}) => {
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handlePress = () => {
    router.push({
      pathname: '/gigs/[id]',
      params: { id: gig.slug || gig.id },
    });
  };

  const proProfile = (gig as any).professionalProfile || gig.professional;
  const sellerFirstName = proProfile?.user?.profile?.firstName || '';
  const sellerLastName = proProfile?.user?.profile?.lastName || '';
  const sellerFullName = sellerFirstName
    ? `${sellerFirstName} ${sellerLastName}`.trim()
    : 'Profesional Verificado';
  const sellerName = proProfile?.businessName || sellerFullName;
  const initial = (sellerFirstName || sellerName || 'P').charAt(0).toUpperCase();

  const basicPackage = gig.packages?.[0];
  const price = gig.startingPrice || basicPackage?.price || 35;
  const rating = gig.ratingAvg ? gig.ratingAvg.toFixed(1) : '4.9';
  const reviews = gig.ratingCount || gig.totalReviews || 18;
  const categoryName = gig.category?.name || 'Servicio';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      {/* 1. TOP ROW: Avatar + Badge + Bookmark (Estilo Talentry Card) */}
      <View style={styles.topRow}>
        <View style={styles.topRowLeft}>
          {/* Avatar / Trade Circle */}
          <View style={styles.avatarCircle}>
            {proProfile?.user?.profile?.avatarUrl ? (
              <CachedImage
                uri={proProfile.user.profile.avatarUrl}
                style={styles.avatarImage}
                resizeMode="cover"
                accessibilityLabel={`${sellerName} avatar`}
                placeholder={<View style={[styles.avatarImage, { backgroundColor: '#EDE8DE' }]} />}
              />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>

          {/* Date / Location Badge */}
          <View style={styles.locationBadge}>
            <Text style={styles.locationBadgeText}>Zaragoza</Text>
          </View>
        </View>

        {/* Bookmark Button */}
        <TouchableOpacity
          style={styles.bookmarkBtn}
          onPress={(e) => {
            e.stopPropagation();
            setIsBookmarked(!isBookmarked);
          }}
          activeOpacity={0.7}
        >
          <Bookmark
            size={16}
            color="#111813"
            fill={isBookmarked ? '#111813' : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      {/* 2. COMPANY / SELLER NAME + VERIFIED GREEN BADGE (Estilo Talentry) */}
      <View style={styles.sellerRow}>
        <Text style={styles.sellerName} numberOfLines={1}>
          {sellerName}
        </Text>
        <View style={styles.verifiedCheckBadge}>
          <Check size={10} color="#FFFFFF" strokeWidth={3.5} />
        </View>
      </View>

      {/* 3. MAIN TITLE (Estilo Talentry) */}
      <Text style={styles.title} numberOfLines={2}>
        {gig.title}
      </Text>

      {/* 4. TAGS / METADATA ROW */}
      <View style={styles.tagsRow}>
        <Text style={styles.tagText}>{categoryName}</Text>
        <Text style={styles.tagDot}>•</Text>
        <Text style={styles.tagText}>Garantía Escrow</Text>
        <Text style={styles.tagDot}>•</Text>
        <Text style={styles.tagText}>Presupuesto Gratis</Text>
      </View>

      {/* 5. PRICE RANGE / STARTING PRICE */}
      <View style={styles.priceRow}>
        <Text style={styles.priceText}>Desde {price} €</Text>
      </View>

      {/* 6. BOTTOM ROW: STATS & BLACK DETAILS PILL BUTTON (Estilo Talentry) */}
      <View style={styles.bottomRow}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Star size={13} color="#D97706" fill="#D97706" />
            <Text style={styles.statText}>{rating}</Text>
            <Text style={styles.statSubText}>({reviews})</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <ShieldCheck size={13} color="#059669" />
            <Text style={styles.statEscrowText}>100% Protegido</Text>
          </View>
        </View>

        {/* Black Capsule Details Button */}
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={handlePress}
          activeOpacity={0.85}
        >
          <Text style={styles.detailsButtonText}>Detalles</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8E2D5',
    padding: 18,
    marginBottom: 14,
    width: '100%',
    ...Shadows.subtle,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  topRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#111813',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  locationBadge: {
    backgroundColor: '#F5ECE3',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  locationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6C756F',
  },
  bookmarkBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E8E2D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sellerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6C756F',
  },
  verifiedCheckBadge: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111813',
    letterSpacing: -0.3,
    lineHeight: 22,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tagText: {
    fontSize: 12,
    color: '#8E9892',
    fontWeight: '600',
  },
  tagDot: {
    fontSize: 12,
    color: '#8E9892',
  },
  priceRow: {
    marginBottom: 14,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111813',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F5ECE3',
    paddingTop: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111813',
  },
  statSubText: {
    fontSize: 11,
    color: '#8E9892',
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E8E2D5',
  },
  statEscrowText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  detailsButton: {
    backgroundColor: '#111813',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 9999,
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
