import { useNavigate } from 'react-router-dom';
import { FileText, TestTube, Stethoscope, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Download, MessageCircle, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { usePrescriptionRequests } from '@/hooks/usePrescriptionRequests';
import { useExamRequests } from '@/hooks/useExamRequests';
import { useConsultationRequests } from '@/hooks/useConsultationRequests';

interface HistoryItem {
  id: string;
  type: 'prescription' | 'exam' | 'consultation';
  title: string;
  status: string;
  price: number;
  created_at: string;
  pdf_url?: string | null;
}

const statusConfig = {
  pending: { label: 'Pendente', icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/80', border: 'border-muted' },
  analyzing: { label: 'Em análise', icon: Clock, color: 'text-health-orange', bg: 'bg-health-orange/10', border: 'border-health-orange/30' },
  approved: { label: 'Aprovado', icon: CheckCircle, color: 'text-health-green', bg: 'bg-health-green/10', border: 'border-health-green/30' },
  rejected: { label: 'Rejeitado', icon: XCircle, color: 'text-health-red', bg: 'bg-health-red/10', border: 'border-health-red/30' },
  correction_needed: { label: 'Correção', icon: AlertCircle, color: 'text-health-orange', bg: 'bg-health-orange/10', border: 'border-health-orange/30' },
  completed: { label: 'Concluído', icon: CheckCircle, color: 'text-health-green', bg: 'bg-health-green/10', border: 'border-health-green/30' },
};

const typeConfig = {
  prescription: { 
    label: 'Receita', 
    icon: FileText, 
    gradient: 'from-primary to-health-blue',
    bgLight: 'bg-primary/5'
  },
  exam: { 
    label: 'Exame', 
    icon: TestTube, 
    gradient: 'from-health-purple to-health-blue',
    bgLight: 'bg-health-purple/5'
  },
  consultation: { 
    label: 'Consulta', 
    icon: Stethoscope, 
    gradient: 'from-health-green to-health-teal',
    bgLight: 'bg-health-green/5'
  },
};

export default function HistoryPage() {
  const navigate = useNavigate();
  
  const { patientRequests: prescriptions, isLoadingPatient: loadingPrescriptions } = usePrescriptionRequests();
  const { patientRequests: exams, isLoadingPatient: loadingExams } = useExamRequests();
  const { patientRequests: consultations, isLoadingPatient: loadingConsultations } = useConsultationRequests();

  const isLoading = loadingPrescriptions || loadingExams || loadingConsultations;

  // Combine all requests into a single list
  const historyItems: HistoryItem[] = [
    ...(prescriptions || []).map((p) => ({
      id: p.id,
      type: 'prescription' as const,
      title: getTypeLabel('prescription', p.prescription_type),
      status: p.status,
      price: Number(p.price),
      created_at: p.created_at,
      pdf_url: p.pdf_url,
    })),
    ...(exams || []).map((e) => ({
      id: e.id,
      type: 'exam' as const,
      title: getTypeLabel('exam', e.exam_type),
      status: e.status,
      price: Number(e.price),
      created_at: e.created_at,
      pdf_url: e.pdf_url,
    })),
    ...(consultations || []).map((c) => ({
      id: c.id,
      type: 'consultation' as const,
      title: `Consulta ${c.specialty}`,
      status: c.status,
      price: Number(c.total_price),
      created_at: c.created_at,
      pdf_url: null,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Stats
  const stats = {
    total: historyItems.length,
    approved: historyItems.filter(i => i.status === 'approved' || i.status === 'completed').length,
    pending: historyItems.filter(i => i.status === 'pending' || i.status === 'analyzing').length,
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadPdf = (pdfUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(pdfUrl, '_blank');
  };

  const handleOpenChat = (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat/${item.id}`, {
      state: {
        requestType: item.type,
        otherUserName: 'Médico',
      }
    });
  };

  return (
    <MobileLayout title="Meu Histórico" showBackButton>
      <div className="p-4 space-y-6 pb-24">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="premium-card p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-health-blue/20 flex items-center justify-center mx-auto mb-2">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="premium-card p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-health-green/20 to-health-teal/20 flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-5 h-5 text-health-green" />
            </div>
            <p className="text-2xl font-bold text-health-green">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">Aprovados</p>
          </div>
          <div className="premium-card p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-health-orange/20 to-health-yellow/20 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-health-orange" />
            </div>
            <p className="text-2xl font-bold text-health-orange">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-health-blue flex items-center justify-center mx-auto mb-4 animate-pulse-soft">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <p className="text-muted-foreground font-medium">Carregando histórico...</p>
            </div>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-health-blue/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-soft">
              <FileText className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">Nenhum histórico</h3>
            <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
              Suas solicitações aparecerão aqui após serem realizadas
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="h-14 px-8 rounded-2xl font-bold bg-gradient-to-r from-primary to-health-blue shadow-lg shadow-primary/30"
            >
              Fazer uma solicitação
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {historyItems.map((item, index) => {
              const TypeIcon = typeConfig[item.type].icon;
              const StatusIcon = statusConfig[item.status as keyof typeof statusConfig]?.icon || Clock;
              const statusInfo = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.pending;
              const typeInfo = typeConfig[item.type];
              const canDownload = item.status === 'approved' && item.pdf_url;
              const canChat = ['analyzing', 'correction_needed', 'pending'].includes(item.status);

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="premium-card p-5 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Type Icon */}
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${typeInfo.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <TypeIcon className="w-7 h-7 text-white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-foreground">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(item.created_at)} • {formatTime(item.created_at)}
                          </div>
                        </div>
                        <p className="font-bold text-foreground text-lg whitespace-nowrap">
                          R${item.price.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      
                      {/* Status Badge */}
                      <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusInfo.label}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {(canDownload || canChat) && (
                    <div className="flex gap-3 mt-5 pt-4 border-t border-border/50">
                      {canChat && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleOpenChat(item, e)}
                          className="flex-1 h-12 rounded-xl border-2 font-semibold active:bg-primary/5 active:border-primary/50 transition-all duration-150"
                          style={{ touchAction: 'manipulation' }}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Conversar
                        </Button>
                      )}
                      {canDownload && item.pdf_url && (
                        <Button
                          size="sm"
                          onClick={(e) => handleDownloadPdf(item.pdf_url!, e)}
                          className="flex-1 h-12 rounded-xl font-semibold bg-gradient-to-r from-health-green to-health-teal shadow-lg shadow-health-green/30"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar PDF
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

function getTypeLabel(type: 'prescription' | 'exam', subType: string): string {
  if (type === 'prescription') {
    switch (subType) {
      case 'controlled': return 'Receita Controlada';
      case 'blue': return 'Receita Azul';
      default: return 'Receita Simples';
    }
  }
  return subType === 'imaging' ? 'Exame de Imagem' : 'Exame Laboratorial';
}
