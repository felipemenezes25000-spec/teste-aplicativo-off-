import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../src/components/Card';
import { COLORS, SIZES } from '../../src/utils/constants';
import api from '../../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminUsers() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await api.get('/admin/users', { params: { token } });
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Erro', 'Não foi possível carregar os usuários');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await api.put(`/admin/users/${userId}/status`, 
        { active: !currentStatus }, 
        { params: { token } }
      );
      loadUsers();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o status');
    }
  };

  const renderUser = ({ item }: { item: any }) => (
    <Card style={styles.userCard}>
      <View style={styles.userAvatar}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userMeta}>
          <View style={[
            styles.roleBadge,
            item.role === 'doctor' && styles.roleBadgeDoctor,
            item.role === 'admin' && styles.roleBadgeAdmin,
          ]}>
            <Text style={styles.roleText}>
              {item.role === 'patient' ? 'Paciente' : item.role === 'doctor' ? 'Médico' : 'Admin'}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.statusButton, item.active === false && styles.statusButtonInactive]}
        onPress={() => handleToggleStatus(item.id, item.active !== false)}
      >
        <Ionicons
          name={item.active !== false ? 'checkmark-circle' : 'close-circle'}
          size={24}
          color={item.active !== false ? COLORS.healthGreen : COLORS.error}
        />
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SIZES.md }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Usuários</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou email..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {filteredUsers.length} usuários encontrados
        </Text>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.md,
    backgroundColor: COLORS.textPrimary,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: SIZES.lg,
    marginTop: SIZES.md,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.sm,
    fontSize: SIZES.fontMd,
    color: COLORS.textPrimary,
  },
  statsBar: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.sm,
  },
  statsText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xxl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: SIZES.fontLg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  userName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: SIZES.fontSm,
    color: COLORS.textMuted,
  },
  userMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radiusSm,
  },
  roleBadgeDoctor: {
    backgroundColor: COLORS.healthGreen + '20',
  },
  roleBadgeAdmin: {
    backgroundColor: COLORS.healthPurple + '20',
  },
  roleText: {
    fontSize: SIZES.fontXs,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusButton: {
    padding: SIZES.sm,
  },
  statusButtonInactive: {
    opacity: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: SIZES.xxl,
  },
  emptyText: {
    marginTop: SIZES.md,
    fontSize: SIZES.fontMd,
    color: COLORS.textMuted,
  },
});
