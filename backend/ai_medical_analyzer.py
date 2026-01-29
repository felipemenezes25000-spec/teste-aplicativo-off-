"""
🤖 AI Medical Document Analyzer
RenoveJá+ Telemedicina

Módulo de IA para análise de documentos médicos:
- Receitas médicas
- Solicitações de exames

Usa Claude Vision para OCR e interpretação semântica.
"""

import os
import base64
import json
import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime
import re

# API Key do Claude
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

# Modelos disponíveis
MODEL_FAST = "claude-3-haiku-20240307"  # Mais barato, para casos simples
MODEL_ACCURATE = "claude-sonnet-4-5-20250929"  # Mais preciso, para casos complexos

# Prompts especializados
PROMPT_PRESCRIPTION = """Você é um especialista em análise de receitas médicas. Analise a imagem da receita médica fornecida e extraia as seguintes informações de forma estruturada:

INSTRUÇÕES:
1. Extraia TODOS os medicamentos visíveis na receita
2. Para cada medicamento, identifique: nome, dosagem, forma farmacêutica, posologia (como tomar), quantidade
3. Identifique informações do paciente se visíveis
4. Identifique informações do médico prescritor se visíveis
5. Identifique a data da receita
6. Identifique observações ou recomendações especiais

IMPORTANTE:
- Se algo não estiver legível, indique como "ilegível" ou "não identificado"
- Mantenha os nomes dos medicamentos exatamente como escritos
- Indique seu nível de confiança (alto/médio/baixo) para cada campo

Retorne APENAS um JSON válido no seguinte formato:
{
  "confidence_overall": "alto|médio|baixo",
  "prescription_date": "DD/MM/YYYY ou null",
  "patient_info": {
    "name": "nome ou null",
    "age": "idade ou null",
    "document": "CPF/RG ou null"
  },
  "prescriber_info": {
    "name": "nome ou null",
    "crm": "CRM ou null",
    "specialty": "especialidade ou null"
  },
  "medications": [
    {
      "name": "nome do medicamento",
      "dosage": "dosagem (ex: 500mg)",
      "form": "comprimido|cápsula|solução|etc",
      "posology": "como tomar (ex: 1 comprimido de 8/8h)",
      "quantity": "quantidade total",
      "duration": "duração do tratamento",
      "confidence": "alto|médio|baixo",
      "notes": "observações específicas"
    }
  ],
  "general_observations": "observações gerais da receita",
  "prescription_type": "simples|controlada|azul|antimicrobiano",
  "raw_text_extracted": "texto bruto extraído da imagem"
}"""

PROMPT_EXAM_REQUEST = """Você é um especialista em análise de solicitações de exames médicos. Analise a imagem da solicitação de exames fornecida e extraia as seguintes informações de forma estruturada:

INSTRUÇÕES:
1. Extraia TODOS os exames solicitados
2. Identifique o tipo de cada exame (laboratorial, imagem, etc.)
3. Identifique informações do paciente
4. Identifique informações do médico solicitante
5. Identifique indicação clínica/hipótese diagnóstica
6. Identifique observações ou preparos especiais

IMPORTANTE:
- Se algo não estiver legível, indique como "ilegível"
- Mantenha os nomes dos exames exatamente como escritos
- Agrupe exames relacionados quando possível
- Indique seu nível de confiança para cada campo

Retorne APENAS um JSON válido no seguinte formato:
{
  "confidence_overall": "alto|médio|baixo",
  "request_date": "DD/MM/YYYY ou null",
  "patient_info": {
    "name": "nome ou null",
    "age": "idade ou null",
    "birth_date": "data nascimento ou null",
    "document": "CPF/RG ou null",
    "gender": "M|F ou null"
  },
  "requester_info": {
    "name": "nome ou null",
    "crm": "CRM ou null",
    "specialty": "especialidade ou null"
  },
  "clinical_indication": "indicação clínica/hipótese diagnóstica",
  "exams": [
    {
      "name": "nome do exame",
      "type": "laboratorial|imagem|funcional|outros",
      "category": "hemograma|bioquímica|hormonal|urinário|etc",
      "preparation": "preparo necessário se houver",
      "urgency": "rotina|urgente",
      "confidence": "alto|médio|baixo"
    }
  ],
  "exam_groups": [
    {
      "group_name": "nome do grupo (ex: Perfil Lipídico)",
      "exams": ["exame1", "exame2"]
    }
  ],
  "general_observations": "observações gerais",
  "raw_text_extracted": "texto bruto extraído da imagem"
}"""


class MedicalDocumentAnalyzer:
    """Analisador de documentos médicos usando Claude Vision"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or ANTHROPIC_API_KEY
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY não configurada")
    
    async def _call_claude_vision(
        self, 
        image_data: str, 
        prompt: str, 
        model: str = MODEL_ACCURATE,
        max_tokens: int = 4096
    ) -> Dict[str, Any]:
        """
        Chama a API do Claude Vision para analisar uma imagem.
        
        Args:
            image_data: Imagem em base64 (com ou sem prefixo data:)
            prompt: Prompt de instrução
            model: Modelo a usar
            max_tokens: Máximo de tokens na resposta
            
        Returns:
            Resposta parseada do Claude
        """
        # Processar base64
        if image_data.startswith("data:"):
            # Extrair o base64 puro
            parts = image_data.split(",")
            if len(parts) > 1:
                image_base64 = parts[1]
                media_type = parts[0].split(":")[1].split(";")[0]
            else:
                image_base64 = image_data
                media_type = "image/jpeg"
        else:
            image_base64 = image_data
            media_type = "image/jpeg"
        
        # Preparar requisição
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        
        payload = {
            "model": model,
            "max_tokens": max_tokens,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": image_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                ANTHROPIC_API_URL,
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                error_detail = response.text
                raise Exception(f"Claude API error: {response.status_code} - {error_detail}")
            
            result = response.json()
            return result
    
    def _extract_json_from_response(self, response: Dict) -> Dict:
        """Extrai JSON da resposta do Claude"""
        try:
            content = response.get("content", [])
            if content and len(content) > 0:
                text = content[0].get("text", "")
                
                # Tentar encontrar JSON no texto
                # Primeiro, tentar parse direto
                try:
                    return json.loads(text)
                except:
                    pass
                
                # Tentar encontrar JSON entre ```json e ```
                json_match = re.search(r'```json\s*([\s\S]*?)\s*```', text)
                if json_match:
                    return json.loads(json_match.group(1))
                
                # Tentar encontrar JSON entre { e }
                json_match = re.search(r'\{[\s\S]*\}', text)
                if json_match:
                    return json.loads(json_match.group(0))
                
                # Se não encontrou JSON, retornar o texto raw
                return {"raw_response": text, "parse_error": True}
                
        except Exception as e:
            return {"error": str(e), "raw_response": str(response)}
    
    async def analyze_prescription(
        self, 
        image_data: str,
        use_accurate_model: bool = True
    ) -> Dict[str, Any]:
        """
        Analisa uma receita médica.
        
        Args:
            image_data: Imagem da receita em base64
            use_accurate_model: Se True, usa modelo mais preciso
            
        Returns:
            Dados estruturados da receita
        """
        model = MODEL_ACCURATE if use_accurate_model else MODEL_FAST
        
        try:
            response = await self._call_claude_vision(
                image_data=image_data,
                prompt=PROMPT_PRESCRIPTION,
                model=model
            )
            
            result = self._extract_json_from_response(response)
            result["analysis_type"] = "prescription"
            result["model_used"] = model
            result["analyzed_at"] = datetime.utcnow().isoformat()
            
            # Calcular custo estimado
            input_tokens = response.get("usage", {}).get("input_tokens", 0)
            output_tokens = response.get("usage", {}).get("output_tokens", 0)
            result["usage"] = {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "estimated_cost_usd": self._estimate_cost(input_tokens, output_tokens, model)
            }
            
            return result
            
        except Exception as e:
            return {
                "error": str(e),
                "analysis_type": "prescription",
                "model_used": model,
                "analyzed_at": datetime.utcnow().isoformat()
            }
    
    async def analyze_exam_request(
        self, 
        image_data: str,
        use_accurate_model: bool = True
    ) -> Dict[str, Any]:
        """
        Analisa uma solicitação de exames.
        
        Args:
            image_data: Imagem da solicitação em base64
            use_accurate_model: Se True, usa modelo mais preciso
            
        Returns:
            Dados estruturados da solicitação
        """
        model = MODEL_ACCURATE if use_accurate_model else MODEL_FAST
        
        try:
            response = await self._call_claude_vision(
                image_data=image_data,
                prompt=PROMPT_EXAM_REQUEST,
                model=model
            )
            
            result = self._extract_json_from_response(response)
            result["analysis_type"] = "exam_request"
            result["model_used"] = model
            result["analyzed_at"] = datetime.utcnow().isoformat()
            
            # Calcular custo estimado
            input_tokens = response.get("usage", {}).get("input_tokens", 0)
            output_tokens = response.get("usage", {}).get("output_tokens", 0)
            result["usage"] = {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "estimated_cost_usd": self._estimate_cost(input_tokens, output_tokens, model)
            }
            
            return result
            
        except Exception as e:
            return {
                "error": str(e),
                "analysis_type": "exam_request",
                "model_used": model,
                "analyzed_at": datetime.utcnow().isoformat()
            }
    
    async def auto_detect_and_analyze(
        self, 
        image_data: str
    ) -> Dict[str, Any]:
        """
        Detecta automaticamente o tipo de documento e analisa.
        
        Args:
            image_data: Imagem do documento em base64
            
        Returns:
            Dados estruturados do documento
        """
        # Prompt para detecção de tipo
        detect_prompt = """Analise esta imagem de documento médico e identifique se é:
1. Uma RECEITA MÉDICA (prescrição de medicamentos)
2. Uma SOLICITAÇÃO DE EXAMES (pedido de exames laboratoriais ou de imagem)
3. OUTRO tipo de documento

Responda APENAS com uma dessas palavras: RECEITA, EXAMES, OUTRO"""
        
        try:
            # Usar modelo rápido para detecção
            response = await self._call_claude_vision(
                image_data=image_data,
                prompt=detect_prompt,
                model=MODEL_FAST,
                max_tokens=50
            )
            
            content = response.get("content", [{}])[0].get("text", "").upper()
            
            if "RECEITA" in content:
                return await self.analyze_prescription(image_data)
            elif "EXAMES" in content or "EXAME" in content:
                return await self.analyze_exam_request(image_data)
            else:
                return {
                    "error": "Tipo de documento não reconhecido",
                    "detected_type": content,
                    "analysis_type": "unknown"
                }
                
        except Exception as e:
            return {"error": str(e), "analysis_type": "detection_failed"}
    
    def _estimate_cost(self, input_tokens: int, output_tokens: int, model: str) -> float:
        """Estima o custo da chamada em USD"""
        # Preços aproximados por 1M tokens (Março 2024)
        if "haiku" in model.lower():
            input_price = 0.25 / 1_000_000
            output_price = 1.25 / 1_000_000
        elif "sonnet" in model.lower():
            input_price = 3.00 / 1_000_000
            output_price = 15.00 / 1_000_000
        else:
            input_price = 3.00 / 1_000_000
            output_price = 15.00 / 1_000_000
        
        return (input_tokens * input_price) + (output_tokens * output_price)


# Funções auxiliares para uso direto
async def analyze_medical_document(
    image_data: str,
    document_type: str = "auto",
    api_key: str = None
) -> Dict[str, Any]:
    """
    Função principal para analisar documentos médicos.
    
    Args:
        image_data: Imagem em base64
        document_type: "prescription", "exam", ou "auto"
        api_key: API key do Anthropic (opcional, usa env var)
        
    Returns:
        Dados estruturados do documento
    """
    analyzer = MedicalDocumentAnalyzer(api_key)
    
    if document_type == "prescription":
        return await analyzer.analyze_prescription(image_data)
    elif document_type == "exam":
        return await analyzer.analyze_exam_request(image_data)
    else:
        return await analyzer.auto_detect_and_analyze(image_data)


# Templates para geração de PDF
PRESCRIPTION_TEMPLATE = {
    "title": "RECEITA MÉDICA",
    "fields": [
        "patient_name", "patient_document", "date",
        "medications", "observations",
        "prescriber_name", "prescriber_crm", "signature"
    ]
}

EXAM_REQUEST_TEMPLATE = {
    "title": "SOLICITAÇÃO DE EXAMES",
    "fields": [
        "patient_name", "patient_document", "patient_birth_date", "date",
        "clinical_indication", "exams",
        "requester_name", "requester_crm", "signature"
    ]
}
