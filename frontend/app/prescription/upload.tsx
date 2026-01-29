/**
 * 📸 Prescription Upload Screen - Modern Design
 * RenoveJá+ Telemedicina
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/services/api';

const typeLabels: Record<string, { title: string; color: string[] }> = {
  simple: { title: 'Receita Simples', color: ['#4AC5E0', '#00B4CD'] },
  controlled: { title: 'Receita Controlada', color: ['#F59E0B', '#D97706'] },
  blue: { title: 'Receita Azul', color: ['#3B82F6', '#1D4ED8'] },
};

export default function PrescriptionUploadScreen() {
  const router = useRouter();
  const { type = 'simple' } = useLocalSearchParams<{ type: string }>();
  const [images, setImages] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const typeConfig = typeLabels[type] || typeLabels.simple;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(a => a.uri);
      setImages([...images, ...newImages]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.createPrescriptionRequest({
        prescription_type: type,
        prescription_images: images,
        notes,
      });
      
      router.push({
        pathname: '/prescription/confirmation',
        params: { type }
      });
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao enviar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={typeConfig.color[0]} />
      
      {/* Header */}
      <LinearGradient
        colors={typeConfig.color}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>Etapa 2 de 3</Text>
          </View>
          <Text style={styles.headerTitle}>{typeConfig.title}</Text>
          <Text style={styles.headerSubtitle}>
            Envie uma foto da sua receita anterior
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Upload Area */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Foto da Receita Anterior</Text>
          <Text style={styles.sectionSubtitle}>
            Envie uma foto legível da sua receita para que o médico possa analisar
          </Text>

          <View style={styles.uploadButtons}>
            <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
              <LinearGradient colors={typeConfig.color} style={styles.uploadButtonGradient}>
                <Ionicons name="camera" size={28} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.uploadButtonText}>Tirar Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <View style={styles.uploadButtonOutline}>
                <Ionicons name="images" size={28} color={typeConfig.color[0]} />
              </View>
              <Text style={styles.uploadButtonText}>Galeria</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Images Preview */}
        {images.length > 0 && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Imagens Anexadas ({images.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(index)}>
                    <Ionicons name="close" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addMoreButton} onPress={pickImage}>
                <Ionicons name="add" size={32} color={typeConfig.color[0]} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Observações (opcional)</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Ex: Preciso da mesma dosagem, uso há 2 anos..."
              placeholderTextColor="#9BA7AF"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Ionicons name="bulb" size={20} color="#F59E0B" />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Dicas para uma boa foto</Text>
            <Text style={styles.tipsText}>• Boa iluminação{'\n'}• Documento completo na imagem{'\n'}• Texto legível e sem reflexos</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
          style={{ marginTop: 24 }}
        >
          <LinearGradient
            colors={loading ? ['#CDD5DA', '#9BA7AF'] : typeConfig.color}
            style={styles.submitButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Continuar</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.skipButtonText}>Continuar sem foto</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },

  header: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 24 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  headerContent: {},
  stepIndicator: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
  stepText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)' },

  content: { flex: 1 },
  contentContainer: { padding: 24 },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A3A4A', marginBottom: 6 },
  sectionSubtitle: { fontSize: 13, color: '#6B7C85', marginBottom: 16, lineHeight: 18 },

  uploadSection: { marginBottom: 24 },
  uploadButtons: { flexDirection: 'row', gap: 16 },
  uploadButton: { flex: 1, alignItems: 'center', gap: 10 },
  uploadButtonGradient: { width: '100%', height: 100, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  uploadButtonOutline: { width: '100%', height: 100, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E4E9EC', borderStyle: 'dashed', backgroundColor: '#FFFFFF' },
  uploadButtonText: { fontSize: 14, fontWeight: '500', color: '#1A3A4A' },

  previewSection: { marginBottom: 24 },
  imagesScroll: { marginTop: 8 },
  imageWrapper: { position: 'relative', marginRight: 12 },
  previewImage: { width: 120, height: 120, borderRadius: 16 },
  removeButton: { position: 'absolute', top: -8, right: -8, width: 28, height: 28, borderRadius: 14, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  addMoreButton: { width: 120, height: 120, borderRadius: 16, borderWidth: 2, borderColor: '#E4E9EC', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },

  notesSection: { marginBottom: 24 },
  textAreaContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#E4E9EC', padding: 16 },
  textArea: { fontSize: 15, color: '#1A3A4A', minHeight: 100 },

  tipsCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FEF3C7', borderRadius: 16, padding: 16, gap: 12 },
  tipsContent: { flex: 1 },
  tipsTitle: { fontSize: 14, fontWeight: '600', color: '#92400E', marginBottom: 6 },
  tipsText: { fontSize: 13, color: '#92400E', lineHeight: 20 },

  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, gap: 8 },
  submitButtonText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },

  skipButton: { alignItems: 'center', paddingVertical: 16 },
  skipButtonText: { fontSize: 14, color: '#6B7C85' },
});
