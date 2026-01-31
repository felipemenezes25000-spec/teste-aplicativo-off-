import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useColorScheme
} from 'react-native';
import { useColors } from '@/contexts/ThemeContext';

const PRIVACY_CONTENT = `
# POLÍTICA DE PRIVACIDADE

**Última atualização:** 29 de Janeiro de 2025

Esta Política descreve como coletamos, usamos e protegemos seus dados, conforme a LGPD (Lei nº 13.709/2018).

## 1. CONTROLADOR DOS DADOS

RenoveJá+ Tecnologia em Saúde LTDA
E-mail do DPO: privacidade@renoveja.com.br

## 2. DADOS COLETADOS

**Dados Pessoais:**
• Nome, e-mail, telefone
• CPF, data de nascimento
• Endereço

**Dados de Saúde (Sensíveis):**
• Histórico de medicamentos
• Receitas e exames
• Registros de consultas
• Informações sobre condições de saúde

**Dados de Uso:**
• Endereço IP, tipo de dispositivo
• Logs de acesso
• Interações com a plataforma

## 3. BASE LEGAL (LGPD)

**Dados Comuns (Art. 7º):**
• Execução de contrato
• Consentimento (marketing)
• Legítimo interesse
• Obrigação legal

**Dados de Saúde (Art. 11):**
• Tutela da saúde
• Consentimento específico

## 4. FINALIDADES

• Criar e gerenciar sua conta
• Prestar serviços de saúde
• Processar pagamentos
• Enviar notificações
• Cumprir obrigações legais
• Melhorar nossos serviços

## 5. COMPARTILHAMENTO

Compartilhamos dados com:
• Médicos e enfermeiros (para atendimento)
• MercadoPago (pagamentos)
• Farmácias (validação de receitas)
• Autoridades (quando exigido por lei)

⚠️ NÃO VENDEMOS SEUS DADOS.

## 6. SEGURANÇA

• Criptografia em trânsito (HTTPS)
• Criptografia em repouso (AES-256)
• Autenticação segura (bcrypt)
• Controle de acesso restrito
• Backups regulares

## 7. RETENÇÃO

• Dados cadastrais: enquanto conta ativa + 5 anos
• Prontuário médico: 20 anos (CFM)
• Receitas: 5 anos
• Logs de acesso: 6 meses

## 8. SEUS DIREITOS (Art. 18 LGPD)

Você pode:
✓ Acessar seus dados
✓ Corrigir dados incorretos
✓ Solicitar exclusão
✓ Portabilidade
✓ Revogar consentimento
✓ Saber com quem compartilhamos

**Como exercer:**
• E-mail: privacidade@renoveja.com.br
• No app: Configurações > Privacidade
• Prazo: 15 dias úteis

## 9. COOKIES

No aplicativo, usamos armazenamento local para:
• Manter sua sessão
• Salvar preferências
• Melhorar performance

## 10. MENORES DE IDADE

Serviços para maiores de 18 anos.
Menores: apenas com consentimento do responsável.

## 11. ALTERAÇÕES

Alterações serão comunicadas por:
• Notificação no app
• E-mail

## 12. CONTATO

**DPO:** privacidade@renoveja.com.br
**Geral:** contato@renoveja.com.br

**ANPD:** www.gov.br/anpd

---

RenoveJá+ Tecnologia em Saúde LTDA
`;

export default function PrivacyScreen() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      fontSize: 22,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
      marginBottom: 16,
    },
    section: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
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
      backgroundColor: isDark ? '#2a3d2a' : '#d4edda',
      padding: 12,
      borderRadius: 8,
      marginVertical: 12,
    },
    warningText: {
      color: isDark ? '#90EE90' : '#155724',
      fontWeight: '600',
    },
  });

  const renderContent = () => {
    const lines = PRIVACY_CONTENT.trim().split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return <Text key={index} style={styles.title}>{line.replace('# ', '')}</Text>;
      }
      if (line.startsWith('## ')) {
        return <Text key={index} style={styles.section}>{line.replace('## ', '')}</Text>;
      }
      if (line.startsWith('⚠️')) {
        return (
          <View key={index} style={styles.warning}>
            <Text style={styles.warningText}>{line.replace('⚠️ ', '')}</Text>
          </View>
        );
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
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
