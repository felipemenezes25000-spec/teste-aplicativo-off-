/**
 * 🤖 AI Document Analysis Screen
 * RenoveJá+ Telemedicina
 * 
 * Tela para análise de documentos médicos com IA:
 * - Upload de foto da receita/exame
 * - Processamento por Claude Vision
 * - Validação e ajustes pelo médico
 * - Pré-preenchimento automático
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/services/api';
import { useColors } from '@/contexts/ThemeContext';

interface Medication {
  name: string;
  dosage: string;
  form: string;
  posology: string;
  quantity: string;
  duration: string;
  confidence: string;
  notes?: string;
}

interface AnalysisResult {
  confidence_overall: string;
  medications?: Medication[];
  exams?: { name: string; type: string; confidence: string }[];
  prescription_type?: string;
  clinical_indication?: string;
  general_observations?: string;
  patient_info?: { name?: string; age?: string };
  prescriber_info?: { name?: string; crm?: string };
  usage?: { estimated_cost_usd: number };
}

export default function AIAnalyzeDocumentScreen() {
  const colors = useColors();
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const router = useRouter();
  
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [editedMedications, setEditedMedications] = useState<Medication[]>([]);
  const [editedExams, setEditedExams] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const documentType = type || (request?.request_type === 'prescription' ? 'prescription' : 'exam');

  useEffect(() => {
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      const data = await api.getRequest(id!);
      setRequest(data);
      
      // Se já tem análise anterior, carregar
      if (data.ai_analysis) {
        setAnalysis(data.ai_analysis);
        if (data.ai_analysis.medications) {
          setEditedMedications(data.ai_analysis.medications);
        }
        if (data.ai_analysis.exams) {
          setEditedExams(data.ai_analysis.exams.map((e: any) => e.name));
        }
      }
      
      // Se tem imagens, usar a primeira
      if (data.prescription_images?.length > 0) {
        setImageUri(data.prescription_images[0]);
      } else if (data.exam_images?.length > 0) {
        setImageUri(data.exam_images[0]);
      } else if (data.image_url) {
        setImageUri(data.image_url);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar a solicitação');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Precisamos de acesso às suas fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
      setAnalysis(null); // Limpar análise anterior
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
      setAnalysis(null);
    }
  };

  const analyzeDocument = async () => {
    if (!imageBase64) {
      Alert.alert('Atenção', 'Selecione ou tire uma foto do documento primeiro');
      return;
    }

    setAnalyzing(true);
    try {
      const endpoint = documentType === 'prescription' 
        ? 'prefillPrescription' 
        : 'prefillExam';
      
      const result = await api.aiAnalyzeDocument({
        request_id: id!,
        image_data: imageBase64,
        document_type: documentType,
      });

      if (result.success) {
        setAnalysis(result.full_analysis || result.analysis);
        
        if (result.prefilled_data?.medications) {
          setEditedMedications(result.prefilled_data.medications);
        }
        if (result.prefilled_data?.exams) {
          setEditedExams(result.prefilled_data.exams);
        }
        
        Alert.alert(
          '✅ Análise Concluída',
          `Confiança: ${result.full_analysis?.confidence_overall || 'N/A'}\n\nRevise os dados extraídos e faça ajustes se necessário.`
        );
      } else {
        throw new Error(result.error || 'Erro na análise');
      }
    } catch (error: any) {
      Alert.alert('Erro na Análise', error.message || 'Não foi possível analisar o documento');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveAndApprove = async () => {
    setSaving(true);
    try {
      // Atualizar solicitação com dados editados
      if (documentType === 'prescription') {
        await api.updateRequest(id!, {
          medications: editedMedications,
          ai_validated: true,
          ai_validated_at: new Date().toISOString(),
        });
      } else {
        await api.updateRequest(id!, {
          exams: editedExams,
          ai_validated: true,
          ai_validated_at: new Date().toISOString(),
        });
      }
      
      Alert.alert('Sucesso', 'Dados validados e salvos!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence?.toLowerCase()) {
      case 'alto': return '#10B981';
      case 'médio': return '#F59E0B';
      case 'baixo': return '#EF4444';
      default: return '#6B7C85';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B4CD" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />
      
      {/* Header */}
      <LinearGradient colors={['#8B5CF6', '#A78BFA']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🤖 Análise com IA</Text>
          <Text style={styles.headerSubtitle}>
            {documentType === 'prescription' ? 'Receita Médica' : 'Solicitação de Exames'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        
        {/* Patient Info */}
        <View style={styles.patientCard}>
          <Text style={styles.patientName}>{request?.patient_name}</Text>
          <Text style={styles.requestType}>
            {request?.request_type === 'prescription' ? 'Renovação de Receita' : 'Pedido de Exames'}
          </Text>
        </View>

        {/* Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📷 Documento</Text>
          
          {imageUri ? (
            <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
              <Image source={{ uri: imageUri }} style={styles.documentImage} resizeMode="contain" />
              <View style={styles.changeImageOverlay}>
                <Ionicons name="camera" size={20} color="#FFFFFF" />
                <Text style={styles.changeImageText}>Trocar imagem</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.uploadContainer}>
              <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                <Ionicons name="camera" size={32} color="#8B5CF6" />
                <Text style={styles.uploadButtonText}>Tirar Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Ionicons name="images" size={32} color="#8B5CF6" />
                <Text style={styles.uploadButtonText}>Galeria</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Analyze Button */}
        {imageBase64 && !analysis && (
          <TouchableOpacity 
            style={styles.analyzeButton} 
            onPress={analyzeDocument}
            disabled={analyzing}
          >
            <LinearGradient
              colors={analyzing ? ['#CDD5DA', '#9BA7AF'] : ['#8B5CF6', '#A78BFA']}
              style={styles.analyzeButtonGradient}
            >
              {analyzing ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.analyzeButtonText}>Analisando com IA...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                  <Text style={styles.analyzeButtonText}>Analisar com IA</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Analysis Results */}
        {analysis && (
          <>
            {/* Confidence Badge */}
            <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(analysis.confidence_overall) + '20' }]}>
              <Ionicons name="shield-checkmark" size={18} color={getConfidenceColor(analysis.confidence_overall)} />
              <Text style={[styles.confidenceText, { color: getConfidenceColor(analysis.confidence_overall) }]}>
                Confiança: {analysis.confidence_overall?.toUpperCase()}
              </Text>
              {analysis.usage?.estimated_cost_usd && (
                <Text style={styles.costText}>
                  Custo: ${analysis.usage.estimated_cost_usd.toFixed(4)}
                </Text>
              )}
            </View>

            {/* Medications (for prescriptions) */}
            {documentType === 'prescription' && editedMedications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💊 Medicamentos Extraídos</Text>
                {editedMedications.map((med, index) => (
                  <View key={index} style={styles.medicationCard}>
                    <View style={styles.medicationHeader}>
                      <Text style={styles.medicationName}>{med.name}</Text>
                      <View style={[styles.confidenceTag, { backgroundColor: getConfidenceColor(med.confidence) + '20' }]}>
                        <Text style={[styles.confidenceTagText, { color: getConfidenceColor(med.confidence) }]}>
                          {med.confidence}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.medicationDetail}>
                      {med.dosage} - {med.form}
                    </Text>
                    <Text style={styles.medicationPosology}>
                      📋 {med.posology}
                    </Text>
                    {med.quantity && (
                      <Text style={styles.medicationQuantity}>
                        📦 Quantidade: {med.quantity}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Exams (for exam requests) */}
            {documentType === 'exam' && editedExams.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔬 Exames Extraídos</Text>
                {editedExams.map((exam, index) => (
                  <View key={index} style={styles.examItem}>
                    <Ionicons name="flask" size={18} color="#8B5CF6" />
                    <Text style={styles.examName}>{exam}</Text>
                  </View>
                ))}
                
                {analysis.clinical_indication && (
                  <View style={styles.indicationBox}>
                    <Text style={styles.indicationLabel}>Indicação Clínica:</Text>
                    <Text style={styles.indicationText}>{analysis.clinical_indication}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Observations */}
            {analysis.general_observations && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📝 Observações</Text>
                <Text style={styles.observationsText}>{analysis.general_observations}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsSection}>
              <TouchableOpacity 
                style={styles.reanalyzeButton}
                onPress={analyzeDocument}
                disabled={analyzing}
              >
                <Ionicons name="refresh" size={18} color="#8B5CF6" />
                <Text style={styles.reanalyzeButtonText}>Reanalisar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveAndApprove}
                disabled={saving}
              >
                <LinearGradient
                  colors={saving ? ['#CDD5DA', '#9BA7AF'] : ['#10B981', '#34D399']}
                  style={styles.saveButtonGradient}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Validar e Salvar</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },

  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 24 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  headerContent: {},
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.card },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  content: { flex: 1 },
  contentContainer: { padding: 20 },

  patientCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  patientName: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  requestType: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },

  imageContainer: { position: 'relative', borderRadius: 16, overflow: 'hidden', backgroundColor: '#F1F5F9' },
  documentImage: { width: '100%', height: 300, backgroundColor: '#F1F5F9' },
  changeImageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 12 },
  changeImageText: { color: colors.card, fontSize: 14, fontWeight: '500' },

  uploadContainer: { flexDirection: 'row', gap: 12 },
  uploadButton: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed' },
  uploadButtonText: { marginTop: 8, fontSize: 14, fontWeight: '500', color: '#8B5CF6' },

  analyzeButton: { marginVertical: 16 },
  analyzeButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 14, gap: 10 },
  analyzeButtonText: { fontSize: 16, fontWeight: '600', color: colors.card },

  confidenceBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 16, gap: 8 },
  confidenceText: { fontSize: 14, fontWeight: '600' },
  costText: { fontSize: 12, color: colors.textSecondary, marginLeft: 'auto' },

  medicationCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#8B5CF6' },
  medicationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  medicationName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  confidenceTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  confidenceTagText: { fontSize: 11, fontWeight: '600' },
  medicationDetail: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  medicationPosology: { fontSize: 14, color: colors.textPrimary, marginTop: 8, backgroundColor: colors.background, padding: 10, borderRadius: 8 },
  medicationQuantity: { fontSize: 13, color: colors.textSecondary, marginTop: 8 },

  examItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, padding: 14, borderRadius: 10, marginBottom: 8 },
  examName: { fontSize: 15, color: colors.textPrimary, flex: 1 },

  indicationBox: { backgroundColor: '#FDF2F8', padding: 14, borderRadius: 10, marginTop: 12 },
  indicationLabel: { fontSize: 12, fontWeight: '600', color: '#EC4899', marginBottom: 4 },
  indicationText: { fontSize: 14, color: colors.textPrimary },

  observationsText: { fontSize: 14, color: colors.textSecondary, backgroundColor: colors.card, padding: 14, borderRadius: 10, lineHeight: 22 },

  actionsSection: { flexDirection: 'row', gap: 12, marginTop: 16 },
  reanalyzeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, borderWidth: 2, borderColor: '#8B5CF6', gap: 8 },
  reanalyzeButtonText: { fontSize: 15, fontWeight: '500', color: '#8B5CF6' },
  saveButton: { flex: 2 },
  saveButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, gap: 8 },
  saveButtonText: { fontSize: 15, fontWeight: '600', color: colors.card },
});
