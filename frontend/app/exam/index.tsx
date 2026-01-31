/**
 * 🔬 Exam Request Screen - Modern Design
 * RenoveJá+ Telemedicina
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/services/api';
import { useColors } from '@/contexts/ThemeContext';

const examCategories = [
  {
    id: 'laboratory',
    title: 'Exames Laboratoriais',
    subtitle: 'Sangue, urina, fezes e outros',
    icon: 'flask',
    gradient: ['#A78BFA', '#7C3AED'],
    examples: ['Hemograma', 'Glicemia', 'Colesterol', 'TSH'],
  },
  {
    id: 'imaging',
    title: 'Exames de Imagem',
    subtitle: 'Raio-X, ultrassom, tomografia',
    icon: 'scan',
    gradient: ['#F472B6', '#EC4899'],
    examples: ['Raio-X', 'Ultrassom', 'Ressonância', 'Tomografia'],
  },
];

export default function ExamRequestScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = createStyles(colors);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
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
    if (!selectedCategory) {
      Alert.alert('Atenção', 'Selecione o tipo de exame');
      return;
    }

    setLoading(true);
    try {
      await api.createExamRequest({
        exam_type: selectedCategory,
        description,
        exam_images: images,
      });
      Alert.alert('Sucesso! 🎉', 'Sua solicitação foi enviada para análise.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao enviar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
      
      {/* Header */}
      <LinearGradient
        colors={['#7C3AED', '#A78BFA']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Solicitar Exames</Text>
          <Text style={styles.headerSubtitle}>
            Peça seus exames de forma rápida e fácil
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Selection */}
        <Text style={styles.sectionTitle}>Tipo de Exame</Text>
        {examCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryCard, selectedCategory === category.id && styles.categoryCardSelected]}
            onPress={() => setSelectedCategory(category.id)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={category.gradient}
              style={styles.categoryIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={category.icon as any} size={28} color="#FFFFFF" />
            </LinearGradient>

            <View style={styles.categoryContent}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
              <View style={styles.examplesContainer}>
                {category.examples.map((ex, i) => (
                  <View key={i} style={styles.exampleBadge}>
                    <Text style={styles.exampleText}>{ex}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.radioOuter, selectedCategory === category.id && styles.radioOuterSelected]}>
              {selectedCategory === category.id && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}

        {/* Description */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Descrição (opcional)</Text>
        <View style={styles.textAreaContainer}>
          <TextInput
            style={styles.textArea}
            placeholder="Descreva os exames que precisa ou sintomas..."
            placeholderTextColor="#9BA7AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Image Upload */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Anexar Pedido Anterior (opcional)</Text>
        <View style={styles.uploadContainer}>
          <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
            <Ionicons name="camera" size={24} color="#7C3AED" />
            <Text style={styles.uploadButtonText}>Câmera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Ionicons name="images" size={24} color="#7C3AED" />
            <Text style={styles.uploadButtonText}>Galeria</Text>
          </TouchableOpacity>
        </View>

        {/* Image Preview */}
        {images.length > 0 && (
          <View style={styles.imagesPreview}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !selectedCategory}
          activeOpacity={0.8}
          style={{ marginTop: 32 }}
        >
          <LinearGradient
            colors={loading || !selectedCategory ? ['#CDD5DA', '#9BA7AF'] : ['#7C3AED', '#A78BFA']}
            style={styles.submitButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Enviar Solicitação</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFB' },

    header: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 24 },
    backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    headerContent: {},
    headerTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
    headerSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)' },

    content: { flex: 1 },
    contentContainer: { padding: 24 },

    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },

    categoryCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'transparent', shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    categoryCardSelected: { borderColor: '#7C3AED', backgroundColor: '#FAF5FF' },
    categoryIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    categoryContent: { flex: 1 },
    categoryTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
    categorySubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
    examplesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    exampleBadge: { backgroundColor: '#F1F5F7', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
    exampleText: { fontSize: 11, color: '#4A5960' },

    radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#CDD5DA', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
    radioOuterSelected: { borderColor: '#7C3AED' },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#7C3AED' },

    textAreaContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#E4E9EC', padding: 16, shadowColor: '#1A3A4A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    textArea: { fontSize: 16, color: colors.textPrimary, minHeight: 100 },

    uploadContainer: { flexDirection: 'row', gap: 12 },
    uploadButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF5FF', borderRadius: 16, paddingVertical: 16, gap: 8, borderWidth: 1.5, borderColor: '#E9D5FF', borderStyle: 'dashed' },
    uploadButtonText: { fontSize: 14, fontWeight: '500', color: '#7C3AED' },

    imagesPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
    imageWrapper: { position: 'relative' },
    previewImage: { width: 80, height: 80, borderRadius: 12 },
    removeImageButton: { position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },

    submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, gap: 8 },
    submitButtonText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  });
}
