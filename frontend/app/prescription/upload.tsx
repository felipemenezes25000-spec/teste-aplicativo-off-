import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { requestsAPI } from '../../src/services/api';
import { COLORS, SIZES, PRESCRIPTION_TYPES } from '../../src/utils/constants';

export default function PrescriptionUploadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type } = useLocalSearchParams<{ type: string }>();
  
  const [images, setImages] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const prescriptionType = PRESCRIPTION_TYPES.find((t) => t.id === type);

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      let result;
      
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permissão negada', 'Precisamos de acesso à câmera para tirar fotos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
          base64: true,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permissão negada', 'Precisamos de acesso à galeria para selecionar fotos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
          base64: true,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const base64 = result.assets[0].base64;
        if (base64) {
          setImages([...images, `data:image/jpeg;base64,${base64}`]);
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      Alert.alert('Atenção', 'Por favor, envie pelo menos uma foto da receita.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await requestsAPI.createPrescription({
        prescription_type: type || 'simple',
        prescription_images: images,
        notes: notes || undefined,
      });

      Alert.alert(
        '✅ Solicitação Enviada!',
        'Sua solicitação foi enviada e está aguardando análise médica. Você será notificado quando houver uma atualização.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/history'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Não foi possível enviar a solicitação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Renovar Receita</Text>
          <View style={styles.progress}>
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, styles.progressDotDone]} />
              <Text style={styles.progressTextDone}>Tipo</Text>
            </View>
            <View style={[styles.progressLine, styles.progressLineDone]} />
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <Text style={styles.progressText}>Upload</Text>
            </View>
            <View style={styles.progressLine} />
            <View style={styles.progressStep}>
              <View style={styles.progressDot} />
              <Text style={styles.progressTextMuted}>Enviar</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected type */}
        <Card style={styles.selectedType}>
          <View style={styles.selectedTypeIcon}>
            <Ionicons name="document-text" size={20} color={COLORS.healthGreen} />
          </View>
          <View style={styles.selectedTypeInfo}>
            <Text style={styles.selectedTypeName}>{prescriptionType?.name}</Text>
            <Text style={styles.selectedTypePrice}>
              R$ {prescriptionType?.price.toFixed(2).replace('.', ',')}
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.healthGreen} />
        </Card>

        <Text style={styles.title}>Envie sua receita atual</Text>
        <Text style={styles.subtitle}>
          Tire uma foto ou faça upload da receita que deseja renovar. O médico irá analisar antes de aprovar.
        </Text>

        {/* Image upload */}
        {images.length > 0 && (
          <View style={styles.imagesContainer}>
            {images.map((img, index) => (
              <View key={index} style={styles.imagePreview}>
                <Image source={{ uri: img }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close" size={20} color={COLORS.textWhite} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {images.length < 3 && (
          <View style={styles.uploadOptions}>
            <TouchableOpacity
              style={styles.uploadOption}
              onPress={() => pickImage('camera')}
            >
              <View style={styles.uploadOptionIcon}>
                <Ionicons name="camera" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.uploadOptionText}>Tirar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.uploadOption}
              onPress={() => pickImage('library')}
            >
              <View style={styles.uploadOptionIcon}>
                <Ionicons name="images" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.uploadOptionText}>Galeria</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Observações (opcional)</Text>
          <Input
            placeholder="Adicione informações relevantes sobre sua receita..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={styles.notesInput}
          />
        </View>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Como funciona?</Text>
            <Text style={styles.infoText}>
              1. Você envia a foto da receita{'\n'}
              2. Um médico analisa sua solicitação{'\n'}
              3. Se aprovada, você recebe notificação para pagar{'\n'}
              4. Após pagamento, recebe a receita assinada
            </Text>
          </View>
        </Card>

        {/* Tips */}
        <Card style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Dicas para uma boa foto:</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark" size={16} color={COLORS.healthGreen} />
              <Text style={styles.tipText}>Certifique-se que a receita está legível</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark" size={16} color={COLORS.healthGreen} />
              <Text style={styles.tipText}>Inclua o nome do médico e CRM</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark" size={16} color={COLORS.healthGreen} />
              <Text style={styles.tipText}>Evite sombras e reflexos na foto</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SIZES.md }]}>
        <Button
          title={isLoading ? "Enviando..." : "Enviar para análise"}
          onPress={handleSubmit}
          fullWidth
          loading={isLoading}
          disabled={images.length === 0 || isLoading}
          icon={!isLoading && <Ionicons name="paper-plane" size={20} color={COLORS.textWhite} />}
        />
      </View>
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
    alignItems: 'flex-start',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    gap: SIZES.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: SIZES.fontXl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginBottom: 4,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  progressDotDone: {
    backgroundColor: COLORS.healthGreen,
  },
  progressLine: {
    width: 30,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: SIZES.xs,
  },
  progressLineDone: {
    backgroundColor: COLORS.healthGreen,
  },
  progressText: {
    fontSize: SIZES.fontXs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  progressTextDone: {
    fontSize: SIZES.fontXs,
    color: COLORS.healthGreen,
    fontWeight: '600',
  },
  progressTextMuted: {
    fontSize: SIZES.fontXs,
    color: COLORS.textMuted,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.lg,
  },
  selectedType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.healthGreen + '10',
    marginBottom: SIZES.lg,
  },
  selectedTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.healthGreen + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTypeInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  selectedTypeName: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  selectedTypePrice: {
    fontSize: SIZES.fontSm,
    color: COLORS.healthGreen,
    fontWeight: '700',
  },
  title: {
    fontSize: SIZES.font2xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.fontMd,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SIZES.lg,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: SIZES.md,
    marginBottom: SIZES.lg,
  },
  uploadOption: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radiusXl,
    padding: SIZES.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  uploadOptionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.md,
  },
  uploadOptionText: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  imagePreview: {
    position: 'relative',
    marginBottom: SIZES.lg,
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: SIZES.radiusXl,
  },
  removeImageButton: {
    position: 'absolute',
    top: SIZES.sm,
    right: SIZES.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesSection: {
    marginBottom: SIZES.lg,
  },
  notesLabel: {
    fontSize: SIZES.fontSm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  tipsCard: {
    backgroundColor: COLORS.backgroundDark,
  },
  tipsTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  tipsList: {
    gap: SIZES.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  tipText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
  },
  footer: {
    padding: SIZES.lg,
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '47%',
  },
  previewImageSmall: {
    width: '100%',
    height: 150,
    borderRadius: SIZES.radiusMd,
  },
  removeImageBtn: {
    position: 'absolute',
    top: SIZES.xs,
    right: SIZES.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SIZES.md,
    backgroundColor: COLORS.primary + '08',
    marginBottom: SIZES.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: SIZES.fontMd,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
  },
  infoText: {
    fontSize: SIZES.fontSm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
