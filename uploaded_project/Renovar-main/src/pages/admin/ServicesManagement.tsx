import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Microscope, 
  Video,
  DollarSign,
  Save,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { priceConfig, specialtyPrices } from '@/data/mockData';
import { Logo } from '@/components/Logo';

interface ServicePrice {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  category: 'prescription' | 'exam' | 'consultation';
  icon: React.ReactNode;
}

export default function ServicesManagement() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServicePrice[]>([
    { id: 'prescription-simple', name: 'Receita Simples', description: 'Renovação de receitas simples', price: priceConfig.prescriptionSimple, originalPrice: priceConfig.prescriptionSimple, category: 'prescription', icon: <FileText className="w-5 h-5" /> },
    { id: 'prescription-controlled', name: 'Receita Controlada', description: 'Renovação de receitas controladas', price: priceConfig.prescriptionControlled, originalPrice: priceConfig.prescriptionControlled, category: 'prescription', icon: <FileText className="w-5 h-5" /> },
    { id: 'prescription-blue', name: 'Receita Azul', description: 'Renovação de receitas especiais', price: priceConfig.prescriptionBlue, originalPrice: priceConfig.prescriptionBlue, category: 'prescription', icon: <FileText className="w-5 h-5" /> },
    { id: 'exam-laboratory', name: 'Exame Laboratorial', description: 'Solicitação de exames laboratoriais', price: priceConfig.examLaboratory, originalPrice: priceConfig.examLaboratory, category: 'exam', icon: <Microscope className="w-5 h-5" /> },
    { id: 'exam-imaging', name: 'Exame de Imagem', description: 'Solicitação de exames de imagem', price: priceConfig.examImaging, originalPrice: priceConfig.examImaging, category: 'exam', icon: <Microscope className="w-5 h-5" /> },
    { id: 'consultation-clinician', name: 'Consulta Clínico Geral', description: 'Preço por minuto', price: specialtyPrices.clinician, originalPrice: specialtyPrices.clinician, category: 'consultation', icon: <Video className="w-5 h-5" /> },
    { id: 'consultation-psychologist', name: 'Consulta Psicólogo', description: 'Preço por minuto', price: specialtyPrices.psychologist, originalPrice: specialtyPrices.psychologist, category: 'consultation', icon: <Video className="w-5 h-5" /> },
  ]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handlePriceChange = (id: string, newPrice: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, price: parseFloat(newPrice) || 0 } : s));
    setHasChanges(true);
  };

  const handleReset = () => {
    setServices(prev => prev.map(s => ({ ...s, price: s.originalPrice })));
    setHasChanges(false);
    toast.info('Preços restaurados');
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setServices(prev => prev.map(s => ({ ...s, originalPrice: s.price })));
    setHasChanges(false);
    setIsSaving(false);
    toast.success('Preços atualizados!');
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = { prescription: 'bg-primary/10 text-primary', exam: 'bg-health-purple/10 text-health-purple', consultation: 'bg-health-green/10 text-health-green' };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  const getCategoryLabel = (category: string) => ({ prescription: 'Receitas', exam: 'Exames', consultation: 'Consultas' }[category] || category);

  const groupedServices = services.reduce((acc, s) => { if (!acc[s.category]) acc[s.category] = []; acc[s.category].push(s); return acc; }, {} as Record<string, ServicePrice[]>);

  return (
    <div className="min-h-[100dvh] bg-gradient-health flex flex-col">
      <div className="bg-gradient-to-r from-primary via-primary to-health-blue px-6 pt-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white/80 hover:text-white"><ArrowLeft className="w-6 h-6" /></button>
          <Logo size="sm" />
          <div className="w-10" />
        </div>
        <h1 className="text-2xl font-display font-bold text-white">Serviços e Preços</h1>
        <p className="text-white/70 text-sm mt-1">Gerencie os valores dos serviços</p>
      </div>

      <div className="flex-1 px-6 pb-32 -mt-4 space-y-6 overflow-y-auto">
        <Card className="bg-health-orange/10 border-health-orange/30 border-0 shadow-card">
          <CardContent className="p-4">
            <p className="text-sm text-health-orange"><strong>Nota:</strong> Alterações afetam apenas novas solicitações.</p>
          </CardContent>
        </Card>

        {Object.entries(groupedServices).map(([category, categoryServices]) => (
          <div key={category}>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">{getCategoryLabel(category)} <Badge className={getCategoryColor(category)}>{categoryServices.length}</Badge></h2>
            <div className="space-y-3">
              {categoryServices.map((service) => (
                <Card key={service.id} className="border-0 shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl ${getCategoryColor(service.category)}`}>{service.icon}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                        <div className="mt-3">
                          <Label htmlFor={service.id} className="text-xs">Preço {service.category === 'consultation' ? '(por minuto)' : ''}</Label>
                          <div className="relative mt-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input id={service.id} type="number" step="0.01" min="0" value={service.price} onChange={(e) => handlePriceChange(service.id, e.target.value)} className="pl-9 rounded-xl" />
                          </div>
                          {service.price !== service.originalPrice && <p className="text-xs text-muted-foreground mt-1">Original: R${service.originalPrice.toFixed(2)}</p>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
          <div className="flex gap-3 max-w-lg mx-auto">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={handleReset} disabled={isSaving}><RotateCcw className="w-4 h-4 mr-2" />Restaurar</Button>
            <Button className="flex-1 rounded-xl" onClick={handleSave} disabled={isSaving}>{isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}{isSaving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
