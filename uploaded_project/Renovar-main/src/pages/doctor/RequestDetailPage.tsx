import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, X, MessageCircle, Loader2, History, FileText, TestTube, Stethoscope, User, Clock, DollarSign, AlertCircle, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { usePrescriptionRequests } from '@/hooks/usePrescriptionRequests';
import { useExamRequests } from '@/hooks/useExamRequests';
import { useAuth } from '@/contexts/AuthContext';
import { usePatientHistory } from '@/hooks/usePatientHistory';
import { supabase } from '@/integrations/supabase/client';
import { errorHandler } from '@/lib/errorHandler';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ChatWindow } from '@/components/ChatWindow';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function RequestDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { request } = location.state || {};
  const { user } = useAuth();
  
  const { updateRequestStatus: updatePrescription, isUpdating: isUpdatingPrescription } = usePrescriptionRequests();
  const { updateRequestStatus: updateExam, isUpdating: isUpdatingExam } = useExamRequests();
  const { history: patientHistory, isLoading: isLoadingHistory } = usePatientHistory(request?.patient_id);
  
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!request) {
    navigate('/doctor');
    return null;
  }

  const isUpdating = isUpdatingPrescription || isUpdatingExam || isGeneratingPdf;

  const generatePdf = async (requestId: string, requestType: 'prescription' | 'exam') => {
    try {
      setIsGeneratingPdf(true);
      
      const { data, error } = await supabase.functions.invoke('generate-pdf', {
        body: {
          requestId,
          requestType,
        },
      });

      if (error) throw error;
      
      return data?.pdfUrl;
    } catch (error) {
      errorHandler.handleError(error, {
        component: 'RequestDetailPage',
        action: 'generatePdf',
        requestId: request.id,
        requestType: request.type,
      });
      toast.error('Erro ao gerar PDF, mas a solicitação foi aprovada.');
      return null;
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleApprove = async () => {
    try {
      const pdfUrl = await generatePdf(request.id, request.type);
      
      const updateData = {
        id: request.id,
        status: 'approved' as const,
        doctor_id: user?.id,
        doctor_notes: '',
        pdf_url: pdfUrl || undefined,
      };

      if (request.type === 'prescription') {
        updatePrescription(updateData, {
          onSuccess: () => {
            toast.success('Receita aprovada! PDF gerado e enviado ao paciente.');
            navigate('/doctor');
          },
          onError: () => {
            toast.error('Erro ao aprovar receita.');
          },
        });
      } else {
        updateExam(updateData, {
          onSuccess: () => {
            toast.success('Exame aprovado! PDF gerado e enviado ao paciente.');
            navigate('/doctor');
          },
          onError: () => {
            toast.error('Erro ao aprovar exame.');
          },
        });
      }
    } catch (error) {
      errorHandler.handleError(error, {
        component: 'RequestDetailPage',
        action: 'handleApprove',
        requestId: request.id,
        requestType: request.type,
      });
    }
  };

  const handleReject = () => {
    if (!notes.trim()) {
      toast.error('Por favor, informe o motivo da rejeição.');
      return;
    }

    const updateData = {
      id: request.id,
      status: 'rejected' as const,
      doctor_id: user?.id,
      rejection_reason: notes,
      doctor_notes: notes,
    };

    if (request.type === 'prescription') {
      updatePrescription(updateData, {
        onSuccess: () => {
          toast.success('Solicitação rejeitada. O paciente será notificado.');
          setRejectDialogOpen(false);
          navigate('/doctor');
        },
        onError: () => {
          toast.error('Erro ao rejeitar solicitação.');
        },
      });
    } else {
      updateExam(updateData, {
        onSuccess: () => {
          toast.success('Solicitação rejeitada. O paciente será notificado.');
          setRejectDialogOpen(false);
          navigate('/doctor');
        },
        onError: () => {
          toast.error('Erro ao rejeitar solicitação.');
        },
      });
    }
  };

  const handleRequestCorrection = () => {
    if (!notes.trim()) {
      toast.error('Por favor, informe o que precisa ser corrigido.');
      return;
    }

    const updateData = {
      id: request.id,
      status: 'correction_needed' as const,
      doctor_id: user?.id,
      doctor_notes: notes,
    };

    if (request.type === 'prescription') {
      updatePrescription(updateData, {
        onSuccess: () => {
          toast.success('Correção solicitada. O paciente receberá uma mensagem.');
          setCorrectionDialogOpen(false);
          navigate('/doctor');
        },
        onError: () => {
          toast.error('Erro ao solicitar correção.');
        },
      });
    } else {
      updateExam(updateData, {
        onSuccess: () => {
          toast.success('Correção solicitada. O paciente receberá uma mensagem.');
          setCorrectionDialogOpen(false);
          navigate('/doctor');
        },
        onError: () => {
          toast.error('Erro ao solicitar correção.');
        },
      });
    }
  };

  const getTypeLabel = () => {
    if (request.type === 'prescription') {
      switch (request.prescriptionType) {
        case 'controlled': return 'Receita Controlada';
        case 'blue': return 'Receita Azul';
        default: return 'Receita Simples';
      }
    }
    return request.examType === 'imaging' ? 'Exame de Imagem' : 'Exame Laboratorial';
  };

  const getTypeBadgeColor = () => {
    if (request.type === 'prescription') {
      switch (request.prescriptionType) {
        case 'controlled': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
        case 'blue': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
        default: return 'bg-green-500/10 text-green-600 border-green-500/20';
      }
    }
    return request.examType === 'imaging' 
      ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' 
      : 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
  };

  return (
    <MobileLayout title="Detalhes da Solicitação" showBackButton showNotifications={false}>
      <div className="p-4 pb-32 space-y-4">
        {/* Patient Info Card */}
        <Card className="border border-border/50 shadow-lg overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={request.patientPhoto} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {request.patientName?.charAt(0) || 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground">{request.patientName}</h3>
                <Badge className={`mt-1 ${getTypeBadgeColor()}`}>
                  {getTypeLabel()}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Valor do serviço</span>
              </div>
              <span className="text-xl font-bold text-primary">
                R$ {request.price.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Patient History Card */}
        <Card className="border border-border/50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <History className="w-4 h-4 text-primary" />
              </div>
              Histórico do Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : patientHistory ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-foreground">{patientHistory.totalRequests}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-xl text-center">
                    <p className="text-2xl font-bold text-green-600">{patientHistory.approved}</p>
                    <p className="text-xs text-muted-foreground">Aprovadas</p>
                  </div>
                  <div className="p-3 bg-red-500/10 rounded-xl text-center">
                    <p className="text-2xl font-bold text-red-600">{patientHistory.rejected}</p>
                    <p className="text-xs text-muted-foreground">Rejeitadas</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl text-center">
                    <p className="text-2xl font-bold text-amber-600">{patientHistory.pending}</p>
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                  </div>
                </div>

                {patientHistory.totalRequests > 0 && (
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{patientHistory.prescriptions}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TestTube className="w-4 h-4" />
                      <span>{patientHistory.exams}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Stethoscope className="w-4 h-4" />
                      <span>{patientHistory.consultations}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                <User className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Primeira solicitação deste paciente.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Notes */}
        {request.patientNotes && (
          <Card className="border border-border/50 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                Observações do Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{request.patientNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Image Card */}
        {request.imageUrl && (
          <Card className="border border-border/50 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Image className="w-4 h-4 text-primary" />
                </div>
                Documento Enviado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl overflow-hidden border border-border bg-muted/30">
                <img
                  src={request.imageUrl}
                  alt="Documento"
                  className="w-full h-auto"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medications (if prescription) */}
        {request.type === 'prescription' && request.medications && request.medications.length > 0 && (
          <Card className="border border-border/50 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                Medicamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {request.medications.map((med: any, index: number) => (
                <div key={index} className="p-4 bg-muted/30 rounded-xl border border-border/50">
                  <p className="font-semibold text-foreground">{med.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{med.dosage} - {med.quantity}</p>
                  {med.instructions && (
                    <p className="text-sm text-muted-foreground mt-1 italic">{med.instructions}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Exams (if exam) */}
        {request.type === 'exam' && request.exams && request.exams.length > 0 && (
          <Card className="border border-border/50 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <TestTube className="w-4 h-4 text-purple-600" />
                </div>
                Exames Solicitados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {request.exams.map((exam: string, index: number) => (
                <div key={index} className="p-3 bg-muted/30 rounded-xl border border-border/50">
                  <p className="text-sm text-foreground">{exam}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fixed Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border space-y-3 safe-bottom">
        <div className="flex gap-3">
          <Button
            onClick={() => {
              setNotes('');
              setRejectDialogOpen(true);
            }}
            variant="outline"
            disabled={isUpdating}
            className="flex-1 h-14 rounded-xl font-semibold border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <X className="w-5 h-5 mr-2" />
            Rejeitar
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isUpdating}
            className="flex-1 h-14 rounded-xl font-semibold bg-green-600 hover:bg-green-700 text-white shadow-lg"
          >
            {isUpdating ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Check className="w-5 h-5 mr-2" />
            )}
            {isGeneratingPdf ? 'Gerando PDF...' : 'Aprovar'}
          </Button>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              setNotes('');
              setCorrectionDialogOpen(true);
            }}
            variant="outline"
            disabled={isUpdating}
            className="flex-1 h-12 rounded-xl font-medium border-primary/50 text-primary hover:bg-primary/10"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Solicitar Correção
          </Button>
          <Button
            onClick={() => setChatDialogOpen(true)}
            variant="outline"
            disabled={isUpdating}
            className="flex-1 h-12 rounded-xl font-medium"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </Button>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <X className="w-5 h-5" />
              Rejeitar Solicitação
            </DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O paciente será notificado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Motivo da rejeição</Label>
              <Textarea
                id="reject-reason"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Documento ilegível, informações insuficientes..."
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleReject}
              disabled={isUpdating || !notes.trim()}
              variant="destructive"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Correction Dialog */}
      <Dialog open={correctionDialogOpen} onOpenChange={setCorrectionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <AlertCircle className="w-5 h-5" />
              Solicitar Correção
            </DialogTitle>
            <DialogDescription>
              Informe o que precisa ser corrigido ou adicionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="correction-notes">O que precisa ser corrigido?</Label>
              <Textarea
                id="correction-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Por favor, envie uma foto mais nítida do documento..."
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCorrectionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRequestCorrection}
              disabled={isUpdating || !notes.trim()}
            >
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
        <DialogContent className="sm:max-w-lg h-[80vh] flex flex-col p-0">
          <ChatWindow
            requestId={request.id}
            requestType={request.type}
            otherUserName={request.patientName}
            onBack={() => setChatDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
