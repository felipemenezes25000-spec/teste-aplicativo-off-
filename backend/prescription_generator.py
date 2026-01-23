"""Prescription PDF Generator with Digital Signature

This module generates professional medical prescriptions in PDF format
with digital signature support compliant with CFM regulations.
"""

import io
import base64
from datetime import datetime
from typing import Dict, Any, List, Optional
import uuid


def generate_prescription_html(prescription_data: Dict[str, Any]) -> str:
    """Generate HTML content for the prescription"""
    
    medications = prescription_data.get('medications', [])
    medications_html = ""
    for i, med in enumerate(medications, 1):
        medications_html += f"""
        <div class="medication">
            <div class="med-number">{i}</div>
            <div class="med-details">
                <strong>{med.get('name', 'Medicamento')}</strong><br>
                Dosagem: {med.get('dosage', '-')}<br>
                Quantidade: {med.get('quantity', '-')}<br>
                <em>Posologia: {med.get('instructions', '-')}</em>
            </div>
        </div>
        """
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: 'Helvetica Neue', Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 40px;
                color: #1a1a1a;
            }}
            .header {{
                text-align: center;
                border-bottom: 3px solid #0EA5E9;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }}
            .logo {{
                font-size: 28px;
                font-weight: bold;
                color: #0EA5E9;
            }}
            .logo span {{
                color: #F97316;
            }}
            .prescription-type {{
                background: #0EA5E9;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                display: inline-block;
                margin-top: 10px;
                font-weight: 600;
            }}
            .doctor-info {{
                background: #f8fafc;
                padding: 20px;
                border-radius: 12px;
                margin-bottom: 30px;
            }}
            .patient-info {{
                margin-bottom: 30px;
            }}
            .medications {{
                margin-bottom: 30px;
            }}
            .medication {{
                display: flex;
                align-items: flex-start;
                padding: 15px;
                background: #f8fafc;
                border-radius: 8px;
                margin-bottom: 10px;
                border-left: 4px solid #0EA5E9;
            }}
            .med-number {{
                background: #0EA5E9;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                margin-right: 15px;
                flex-shrink: 0;
            }}
            .signature-section {{
                margin-top: 50px;
                text-align: center;
                border-top: 2px dashed #e2e8f0;
                padding-top: 30px;
            }}
            .signature-line {{
                border-bottom: 2px solid #1a1a1a;
                width: 300px;
                margin: 30px auto 10px;
            }}
            .digital-stamp {{
                background: #22c55e15;
                border: 2px solid #22c55e;
                border-radius: 12px;
                padding: 15px;
                margin-top: 20px;
                display: inline-block;
            }}
            .qr-section {{
                margin-top: 20px;
                padding: 15px;
                background: #f8fafc;
                border-radius: 8px;
            }}
            .footer {{
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
                color: #64748b;
            }}
            .warning {{
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 15px;
                margin-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">RenoveJá<span>+</span></div>
            <p style="color: #64748b; margin: 10px 0;">Telemedicina - Atendimento Digital</p>
            <div class="prescription-type">
                RECEITA {prescription_data.get('prescription_type', 'SIMPLES').upper()}
            </div>
        </div>
        
        <div class="doctor-info">
            <strong>MÉDICO(A) RESPONSÁVEL</strong><br>
            {prescription_data.get('doctor_name', 'Dr(a). Nome do Médico')}<br>
            CRM: {prescription_data.get('doctor_crm', '000000')} - {prescription_data.get('doctor_crm_state', 'UF')}<br>
            Especialidade: {prescription_data.get('doctor_specialty', 'Clínico Geral')}
        </div>
        
        <div class="patient-info">
            <strong>PACIENTE</strong><br>
            Nome: {prescription_data.get('patient_name', 'Nome do Paciente')}<br>
            CPF: {prescription_data.get('patient_cpf', '***.***.***-**')}<br>
            Data de Nascimento: {prescription_data.get('patient_birth_date', '--/--/----')}
        </div>
        
        <div class="medications">
            <strong>MEDICAMENTOS PRESCRITOS</strong>
            {medications_html if medications_html else '<p>Nenhum medicamento especificado</p>'}
        </div>
        
        {f'<div class="warning"><strong>⚠️ ATENÇÃO:</strong> {prescription_data.get("notes", "")}</div>' if prescription_data.get('notes') else ''}
        
        <div class="signature-section">
            <div class="signature-line"></div>
            <strong>{prescription_data.get('doctor_name', 'Dr(a). Nome do Médico')}</strong><br>
            CRM: {prescription_data.get('doctor_crm', '000000')}-{prescription_data.get('doctor_crm_state', 'UF')}
            
            <div class="digital-stamp">
                ✓ DOCUMENTO ASSINADO DIGITALMENTE<br>
                <small>
                    ID: {prescription_data.get('signature_id', str(uuid.uuid4())[:8])}<br>
                    Data: {datetime.now().strftime('%d/%m/%Y %H:%M')}<br>
                    Hash: {prescription_data.get('document_hash', 'xxx')[:16]}...
                </small>
            </div>
            
            <div class="qr-section">
                <strong>VERIFICAÇÃO</strong><br>
                <small>Escaneie o QR Code ou acesse:</small><br>
                <code>{prescription_data.get('verification_url', 'https://renoveja.com.br/verify/xxx')}</code>
            </div>
        </div>
        
        <div class="footer">
            <p>
                Este documento foi emitido eletronicamente e possui validade legal conforme<br>
                Resolução CFM nº 2.299/2021 e Lei nº 14.063/2020.
            </p>
            <p>
                RenoveJá+ Telemedicina | CNPJ: XX.XXX.XXX/0001-XX<br>
                Atendimento: atendimento@renoveja.com.br | WhatsApp: (11) 99999-9999
            </p>
        </div>
    </body>
    </html>
    """
    
    return html


async def create_signed_prescription(
    patient_data: Dict[str, Any],
    doctor_data: Dict[str, Any],
    medications: List[Dict[str, Any]],
    prescription_type: str,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a complete signed prescription document.
    
    Returns:
        Dict with prescription details, HTML content, and signature info
    """
    from integrations import get_signature_service
    
    # Prepare prescription data
    prescription_data = {
        "patient_name": patient_data.get("name"),
        "patient_cpf": patient_data.get("cpf"),
        "patient_birth_date": patient_data.get("birth_date"),
        "doctor_name": doctor_data.get("name"),
        "doctor_crm": doctor_data.get("crm"),
        "doctor_crm_state": doctor_data.get("crm_state"),
        "doctor_specialty": doctor_data.get("specialty"),
        "medications": medications,
        "prescription_type": prescription_type,
        "notes": notes,
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Get signature service and sign the prescription
    signature_service = get_signature_service()
    signed_result = await signature_service.sign_prescription(
        prescription_data,
        doctor_data.get("crm"),
        doctor_data.get("name")
    )
    
    # Add signature info to prescription data for HTML generation
    prescription_data.update({
        "signature_id": signed_result["signature"]["signature_id"],
        "document_hash": signed_result["signed_document_hash"],
        "verification_url": signed_result["signature"]["verification_url"]
    })
    
    # Generate HTML
    html_content = generate_prescription_html(prescription_data)
    
    return {
        "prescription_id": signed_result["prescription"]["id"],
        "html_content": html_content,
        "signature": signed_result["signature"],
        "document_hash": signed_result["signed_document_hash"],
        "qr_code_data": signed_result["qr_code_data"],
        "is_icp_brasil": signed_result["signature"]["is_icp_brasil"],
        "created_at": prescription_data["created_at"]
    }
