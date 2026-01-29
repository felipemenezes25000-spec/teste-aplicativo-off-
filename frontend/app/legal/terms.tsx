import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator,
  useColorScheme 
} from 'react-native';

const TERMS_CONTENT = `
# TERMOS DE USO - RenoveJá+

**Última atualização:** 29 de Janeiro de 2025

## 1. DEFINIÇÕES

Para os fins destes Termos de Uso, consideram-se:

• **Plataforma**: O aplicativo móvel e sistema web RenoveJá+, incluindo todas as suas funcionalidades.
• **Usuário**: Toda pessoa física que acessa ou utiliza a Plataforma.
• **Paciente**: Usuário que utiliza a Plataforma para solicitar serviços de saúde.
• **Profissional de Saúde**: Médico, enfermeiro ou outro profissional devidamente registrado.
• **Serviços**: Renovação de receitas médicas, solicitação de exames e teleconsultas.

## 2. ACEITAÇÃO DOS TERMOS

Ao acessar ou usar a Plataforma RenoveJá+, você concorda com estes Termos de Uso e com nossa Política de Privacidade.

## 3. DESCRIÇÃO DOS SERVIÇOS

A RenoveJá+ oferece:
• Renovação de Receitas (simples, controladas e azuis)
• Solicitação de Exames (laboratoriais e de imagem)
• Teleconsultas (consultas médicas por vídeo)

**Importante**: Não somos um serviço de emergência médica.

## 4. ELEGIBILIDADE

Para utilizar a Plataforma, você deve:
• Ter pelo menos 18 anos de idade
• Possuir capacidade civil plena
• Fornecer informações verdadeiras
• Residir em território brasileiro

## 5. CADASTRO E CONTA

Você é responsável por:
• Manter suas credenciais em sigilo
• Fornecer informações verdadeiras e atualizadas
• Não compartilhar sua conta com terceiros
• Notificar uso não autorizado

## 6. REGRAS DE USO

É PROIBIDO:
• Fornecer informações falsas
• Tentar obter receitas de forma fraudulenta
• Utilizar para emergências médicas
• Compartilhar receitas com terceiros
• Revender medicamentos

## 7. TELEMEDICINA

Os serviços são prestados conforme a Resolução CFM nº 2.314/2022.

A telemedicina NÃO substitui atendimento presencial em:
• Emergências médicas
• Necessidade de exame físico
• Procedimentos invasivos

## 8. PAGAMENTOS

• Preços informados antes da confirmação
• Formas: PIX, Cartão de crédito/débito
• Reembolso integral se solicitação rejeitada
• Processamento via MercadoPago

## 9. LIMITAÇÃO DE RESPONSABILIDADE

A RenoveJá+ NÃO se responsabiliza por:
• Diagnósticos ou tratamentos prescritos
• Reações adversas a medicamentos
• Uso indevido de receitas
• Informações falsas fornecidas pelo usuário

⚠️ EM EMERGÊNCIA: SAMU 192 ou Pronto-Socorro

## 10. PRIVACIDADE

Tratamento de dados conforme a LGPD (Lei nº 13.709/2018).
Veja nossa Política de Privacidade completa.

## 11. LEGISLAÇÃO E FORO

Regido pelas leis brasileiras.
Foro: Comarca de São Paulo/SP.

## 12. CONTATO

E-mail: contato@renoveja.com.br

---

RenoveJá+ Tecnologia em Saúde LTDA
`;

export default function TermsScreen() {
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
    content: {
      fontSize: 15,
      lineHeight: 24,
      color: isDark ? '#e0e0e0' : '#333',
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
      backgroundColor: isDark ? '#3d2a2a' : '#fff3cd',
      padding: 12,
      borderRadius: 8,
      marginVertical: 12,
    },
    warningText: {
      color: isDark ? '#ffb347' : '#856404',
      fontWeight: '500',
    },
  });

  // Simple markdown-like rendering
  const renderContent = () => {
    const lines = TERMS_CONTENT.trim().split('\n');
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
            <Text style={styles.warningText}>{line}</Text>
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
