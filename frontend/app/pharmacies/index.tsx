/**
 * 📍 Pharmacies Near Me - Geolocation
 * RenoveJá+ Telemedicina
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  isOpen: boolean;
  phone?: string;
  lat: number;
  lng: number;
}

// Simulated pharmacies data (would come from Google Places API in production)
const MOCK_PHARMACIES: Pharmacy[] = [
  { id: '1', name: 'Drogasil', address: 'Av. Paulista, 1000', distance: '350m', rating: 4.5, isOpen: true, phone: '(11) 3333-1111', lat: -23.561, lng: -46.656 },
  { id: '2', name: 'Droga Raia', address: 'Rua Augusta, 500', distance: '500m', rating: 4.3, isOpen: true, phone: '(11) 3333-2222', lat: -23.555, lng: -46.662 },
  { id: '3', name: 'Pacheco', address: 'Av. Rebouças, 200', distance: '800m', rating: 4.1, isOpen: false, phone: '(11) 3333-3333', lat: -23.565, lng: -46.670 },
  { id: '4', name: 'Pague Menos', address: 'Rua da Consolação, 1500', distance: '1.2km', rating: 4.0, isOpen: true, phone: '(11) 3333-4444', lat: -23.550, lng: -46.658 },
  { id: '5', name: 'Drogaria São Paulo', address: 'Av. Brasil, 800', distance: '1.5km', rating: 4.4, isOpen: true, phone: '(11) 3333-5555', lat: -23.570, lng: -46.650 },
];

export default function PharmaciesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPharmacies();
  }, []);

  const loadPharmacies = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permissão de localização negada');
        setPharmacies(MOCK_PHARMACIES);
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      
      // In production, would call Google Places API here
      // For now, use mock data sorted by "distance"
      setPharmacies(MOCK_PHARMACIES);
    } catch (err) {
      setError('Erro ao obter localização');
      setPharmacies(MOCK_PHARMACIES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openMaps = (pharmacy: Pharmacy) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${pharmacy.name}@${pharmacy.lat},${pharmacy.lng}`,
      android: `geo:0,0?q=${pharmacy.lat},${pharmacy.lng}(${pharmacy.name})`,
    });
    if (url) Linking.openURL(url);
  };

  const callPharmacy = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Ionicons
        key={i}
        name={i < Math.floor(rating) ? 'star' : i < rating ? 'star-half' : 'star-outline'}
        size={14}
        color="#F59E0B"
      />
    ));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B4CD" />
        <Text style={styles.loadingText}>Buscando farmácias...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />
      
      <LinearGradient colors={['#10B981', '#34D399']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Farmácias Próximas</Text>
          <Text style={styles.headerSubtitle}>
            {location ? 'Baseado na sua localização' : 'Localização aproximada'}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={loadPharmacies}>
          <Ionicons name="refresh" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={18} color="#F59E0B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPharmacies(); }} colors={['#10B981']} />}
      >
        {pharmacies.map((pharmacy) => (
          <View key={pharmacy.id} style={styles.pharmacyCard}>
            <View style={styles.pharmacyHeader}>
              <View style={styles.pharmacyIcon}>
                <Ionicons name="medical" size={24} color="#10B981" />
              </View>
              <View style={styles.pharmacyInfo}>
                <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
                <Text style={styles.pharmacyAddress}>{pharmacy.address}</Text>
                <View style={styles.pharmacyMeta}>
                  <View style={styles.ratingContainer}>
                    {renderStars(pharmacy.rating)}
                    <Text style={styles.ratingText}>{pharmacy.rating}</Text>
                  </View>
                  <View style={[styles.statusBadge, pharmacy.isOpen ? styles.openBadge : styles.closedBadge]}>
                    <Text style={[styles.statusText, pharmacy.isOpen ? styles.openText : styles.closedText]}>
                      {pharmacy.isOpen ? 'Aberta' : 'Fechada'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.distanceContainer}>
                <Ionicons name="navigate" size={16} color="#6B7C85" />
                <Text style={styles.distanceText}>{pharmacy.distance}</Text>
              </View>
            </View>
            
            <View style={styles.pharmacyActions}>
              <TouchableOpacity style={styles.actionButton} onPress={() => openMaps(pharmacy)}>
                <Ionicons name="map" size={18} color="#00B4CD" />
                <Text style={styles.actionText}>Rota</Text>
              </TouchableOpacity>
              {pharmacy.phone && (
                <TouchableOpacity style={styles.actionButton} onPress={() => callPharmacy(pharmacy.phone!)}>
                  <Ionicons name="call" size={18} color="#10B981" />
                  <Text style={[styles.actionText, { color: '#10B981' }]}>Ligar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={22} color="#3B82F6" />
          <Text style={styles.tipText}>
            Leve sua receita digital no celular. A maioria das farmácias aceita receitas digitais válidas.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  loadingContainer: { flex: 1, backgroundColor: '#F8FAFB', alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7C85' },

  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerContent: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  refreshButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  errorText: { fontSize: 13, color: '#92400E' },

  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },

  pharmacyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  pharmacyHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  pharmacyIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' },
  pharmacyInfo: { flex: 1, marginLeft: 14 },
  pharmacyName: { fontSize: 16, fontWeight: '600', color: '#1A3A4A' },
  pharmacyAddress: { fontSize: 13, color: '#6B7C85', marginTop: 2 },
  pharmacyMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: '#6B7C85', marginLeft: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  openBadge: { backgroundColor: '#D1FAE5' },
  closedBadge: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 11, fontWeight: '600' },
  openText: { color: '#059669' },
  closedText: { color: '#DC2626' },
  distanceContainer: { alignItems: 'center', gap: 2 },
  distanceText: { fontSize: 13, fontWeight: '600', color: '#1A3A4A' },

  pharmacyActions: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F7', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, backgroundColor: '#F8FAFB', borderRadius: 10, gap: 6 },
  actionText: { fontSize: 14, fontWeight: '500', color: '#00B4CD' },

  tipCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#DBEAFE', borderRadius: 14, padding: 16, marginTop: 8, gap: 12 },
  tipText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 20 },
});
