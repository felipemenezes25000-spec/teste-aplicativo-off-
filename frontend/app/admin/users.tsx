/**
 * 👥 Admin Users - Modern Design
 * RenoveJá+ Telemedicina
 */

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
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/services/api';

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      const data = await api.getAdminUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.updateUserStatus(userId, !currentStatus);
      loadUsers();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o status');
    }
  };

  const getRoleBadge = (role: string) => {
    const config: Record<string, { label: string; color: string; bg: string }> = {
      patient: { label: 'Paciente', color: '#00B4CD', bg: '#E6F7FA' },
      doctor: { label: 'Médico', color: '#10B981', bg: '#D1FAE5' },
      nurse: { label: 'Enfermeiro', color: '#8B5CF6', bg: '#EDE9FE' },
      admin: { label: 'Admin', color: '#F59E0B', bg: '#FEF3C7' },
    };
    return config[role] || config.patient;
  };

  const renderUser = ({ item }: { item: any }) => {
    const roleBadge = getRoleBadge(item.role);
    
    return (
      <View style={styles.userCard}>
        <LinearGradient
          colors={[roleBadge.color, roleBadge.color + 'CC']}
          style={styles.userAvatar}
        >
          <Text style={styles.avatarText}>
            {item.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </LinearGradient>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
            <Text style={[styles.roleText, { color: roleBadge.color }]}>{roleBadge.label}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => handleToggleStatus(item.id, item.active !== false)}
        >
          <Ionicons
            name={item.active !== false ? 'checkmark-circle' : 'close-circle'}
            size={28}
            color={item.active !== false ? '#10B981' : '#EF4444'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3A4A" />
      
      {/* Header */}
      <LinearGradient colors={['#1A3A4A', '#2D5A6B']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Usuários</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9BA7AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou email..."
          placeholderTextColor="#9BA7AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9BA7AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>{filteredUsers.length} usuários encontrados</Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00B4CD" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={40} color="#9BA7AF" />
              </View>
              <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },

  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 24, marginTop: 16, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E4E9EC', height: 48 },
  searchInput: { flex: 1, fontSize: 15, color: '#1A3A4A', marginHorizontal: 10 },

  statsBar: { paddingHorizontal: 24, paddingVertical: 12 },
  statsText: { fontSize: 13, color: '#9BA7AF' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  listContent: { paddingHorizontal: 24, paddingBottom: 40 },

  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  userAvatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  userInfo: { flex: 1, marginLeft: 14 },
  userName: { fontSize: 15, fontWeight: '600', color: '#1A3A4A' },
  userEmail: { fontSize: 13, color: '#6B7C85', marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  roleText: { fontSize: 11, fontWeight: '600' },
  statusButton: { padding: 8 },

  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#F1F5F7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#6B7C85' },
});
