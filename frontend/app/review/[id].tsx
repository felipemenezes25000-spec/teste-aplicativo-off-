/**
 * ⭐ Post-Consultation Review
 * RenoveJá+ Telemedicina
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '@/services/api';
import { useColors } from '@/contexts/ThemeContext';

const REVIEW_TAGS = [
  { id: 'professional', label: 'Profissional', icon: 'briefcase' },
  { id: 'attentive', label: 'Atencioso', icon: 'heart' },
  { id: 'clear', label: 'Explicou bem', icon: 'chatbubbles' },
  { id: 'punctual', label: 'Pontual', icon: 'time' },
  { id: 'recommended', label: 'Recomendo', icon: 'thumbs-up' },
];

export default function ReviewScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState<any>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      const data = await api.getRequest(id!);
      setRequest(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRequest(false);
    }
  };

  const handleRating = (value: number) => {
    setRating(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Avaliação', 'Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    setLoading(true);
    try {
      await api.submitReview(id!, {
        rating,
        tags: selectedTags,
        comment: comment.trim() || null,
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Obrigado!', 'Sua avaliação foi enviada com sucesso.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível enviar a avaliação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  if (loadingRequest) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  const getRatingLabel = () => {
    const labels = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'];
    return labels[rating] || '';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.warning} />
      
      <LinearGradient colors={['#F59E0B', '#FBBF24']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.starIconContainer}>
            <Ionicons name="star" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>Como foi sua experiência?</Text>
          <Text style={styles.headerSubtitle}>
            {request?.doctor_name ? `Consulta com ${request.doctor_name}` : 'Avalie o atendimento'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Rating Stars */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>Nota geral</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => handleRating(star)} activeOpacity={0.7}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={44}
                  color={star <= rating ? '#F59E0B' : '#CDD5DA'}
                  style={styles.star}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{getRatingLabel()}</Text>
          )}
        </View>

        {/* Tags */}
        <View style={styles.tagsSection}>
          <Text style={styles.sectionTitle}>O que você mais gostou?</Text>
          <View style={styles.tagsContainer}>
            {REVIEW_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={[styles.tag, selectedTags.includes(tag.id) && styles.tagSelected]}
                onPress={() => toggleTag(tag.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tag.icon as any}
                  size={16}
                  color={selectedTags.includes(tag.id) ? '#FFFFFF' : '#6B7C85'}
                />
                <Text style={[styles.tagText, selectedTags.includes(tag.id) && styles.tagTextSelected]}>
                  {tag.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Comment */}
        <View style={styles.commentSection}>
          <Text style={styles.sectionTitle}>Comentário (opcional)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Conte mais sobre sua experiência..."
            placeholderTextColor="#9BA7AF"
            multiline
            numberOfLines={4}
            maxLength={500}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
            <LinearGradient
              colors={rating > 0 ? ['#F59E0B', '#FBBF24'] : ['#CDD5DA', '#E4E9EC']}
              style={styles.submitButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Enviar Avaliação</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Avaliar depois</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },

  header: { paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24, alignItems: 'center' },
  headerContent: { alignItems: 'center' },
  starIconContainer: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.card, textAlign: 'center' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 6 },

  content: { flex: 1 },
  contentContainer: { padding: 24, paddingBottom: 40 },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 14 },

  ratingSection: { alignItems: 'center', marginBottom: 32 },
  starsContainer: { flexDirection: 'row', gap: 8 },
  star: { marginHorizontal: 4 },
  ratingLabel: { marginTop: 12, fontSize: 18, fontWeight: '600', color: colors.warning },

  tagsSection: { marginBottom: 28 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.card, borderRadius: 24, borderWidth: 1.5, borderColor: colors.border, gap: 6 },
  tagSelected: { backgroundColor: colors.warning, borderColor: colors.warning },
  tagText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  tagTextSelected: { color: colors.card },

  commentSection: { marginBottom: 32 },
  commentInput: { backgroundColor: colors.card, borderRadius: 14, padding: 16, fontSize: 15, color: colors.textPrimary, minHeight: 120, borderWidth: 1, borderColor: colors.border },
  charCount: { textAlign: 'right', marginTop: 6, fontSize: 12, color: colors.textMuted },

  actions: { gap: 12 },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 14, gap: 8 },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: colors.card },
  skipButton: { alignItems: 'center', justifyContent: 'center', height: 44 },
  skipButtonText: { fontSize: 15, color: colors.textSecondary },
});
