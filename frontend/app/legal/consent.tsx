import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CONSENT_CONTENT = `
# TERMO DE CONSENTIMENTO PARA TELEMEDICINA

Conforme Resolução CFM nº 2.314/2022

## O QUE É TELEMEDICINA

Telemedicina é o exercício da medicina mediado por tecnologias, permitindo consultas, diagnósticos e acompanhamentos à distância.

## SERVIÇOS OFERECIDOS

• Teleconsulta por vídeo em tempo real
• Renovação de receitas médicas
• Solicitação de exames

## BENEFÍCIOS

• Acesso facilitado a profissionais
• Redução de deslocamentos
• Agilidade no atendimento
• Comodidade e praticidade

## LIMITAÇÕES IMPORTANTES

A telemedicina NÃO substitui atendimento presencial em:
• Emergências médicas
• Necessidade de exame físico
• Procedimentos invasivos
• Sintomas graves ou de início súbito

## ⚠️ EM CASO DE EMERGÊNCIA

A telemedicina NÃO é serviço de emergência!

• SAMU: 192
• Bombeiros: 193
• Procure o pronto-socorro mais próximo

## REQUISITOS TÉCNICOS

• Conexão estável de internet (mín. 1 Mbps)
• Câmera e microfone funcionais
• Ambiente silencioso e bem iluminado
• Privacidade durante a consulta

## PRIVACIDADE

• O médico mantém sigilo conforme Código de Ética
• A consulta NÃO será gravada sem consentimento
• Você deve garantir privacidade no local

## SEUS DIREITOS

• Receber informações claras
• Ter dúvidas esclarecidas
• Recusar tratamento
• Solicitar atendimento presencial
• Acessar seu prontuário

## SUAS RESPONSABILIDADES

• Fornecer informações verdadeiras
• Informar medicamentos em uso
• Relatar alergias conhecidas
• Seguir orientações médicas

## AO ACEITAR, VOCÊ DECLARA QUE:

☑️ Leu e compreendeu este termo
☑️ Entende os benefícios e limitações
☑️ Sabe que não substitui emergências
☑️ Fornecerá informações verdadeiras
☑️ Autoriza o atendimento por telemedicina
`;

interface ConsentScreenProps {
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

export default function ConsentScreen({ onAccept, showAcceptButton = true }: ConsentScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(true);
    if (onAccept) {
      onAccept();
    } else {
      Alert.alert(
        'Consentimento Registrado',
        'Seu consentimento foi registrado com sucesso.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
    },
    scrollView: {
      flex: 1,
      padding: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
      marginBottom: 16,
      textAlign: 'center',
    },
    section: {
      fontSize: 17,
      fontWeight: 'bold',
      color: '#00B4CD',
      marginTop: 20,
      marginBottom: 8,
    },
    paragraph: {
      fontSize: 15,
      lineHeight: 24,
      color: isDark ? '#e0e0e0' : '#333',
      marginBottom: 12,
    },
    warning: {
      backgroundColor: isDark ? '#3d2a2a' : '#f8d7da',
      padding: 16,
      borderRadius: 8,
      marginVertical: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#dc3545',
    },
    warningText: {
      color: isDark ? '#ff6b6b' : '#721c24',
      fontWeight: '600',
      fontSize: 15,
    },
    buttonContainer: {
      padding: 16,
      paddingBottom: 32,
    },
    acceptButton: {
      backgroundColor: '#00B4CD',
      paddingVertical: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    acceptButtonDisabled: {
      backgroundColor: '#ccc',
    },
    acceptButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderRadius: 12,
      marginBottom: 16,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: '#00B4CD',
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: '#00B4CD',
    },
    checkboxLabel: {
      flex: 1,
      fontSize: 14,
      color: isDark ? '#e0e0e0' : '#333',
    },
  });

  const renderContent = () => {
    const lines = CONSENT_CONTENT.trim().split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return <Text key={index} style={styles.title}>{line.replace('# ', '')}</Text>;
      }
      if (line.startsWith('## ')) {
        const text = line.replace('## ', '');
        if (text.includes('⚠️') || text.includes('EMERGÊNCIA')) {
          return (
            <View key={index} style={styles.warning}>
              <Text style={styles.warningText}>{text}</Text>
            </View>
          );
        }
        return <Text key={index} style={styles.section}>{text}</Text>;
      }
      if (line.trim()) {
        return <Text key={index} style={styles.paragraph}>{line}</Text>;
      }
      return null;
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {renderContent()}
        <View style={{ height: 20 }} />
      </ScrollView>
      
      {showAcceptButton && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setAccepted(!accepted)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
              {accepted && <Ionicons name="checkmark" size={18} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>
              Li, compreendi e aceito os termos acima
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acceptButton, !accepted && styles.acceptButtonDisabled]}
            onPress={handleAccept}
            disabled={!accepted}
            activeOpacity={0.8}
          >
            <Ionicons name="shield-checkmark" size={24} color="#fff" />
            <Text style={styles.acceptButtonText}>Aceitar e Continuar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
