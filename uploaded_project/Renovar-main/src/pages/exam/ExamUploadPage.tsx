import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Upload, X, Loader2, Camera, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useFileUpload } from '@/hooks/useFileUpload';
import { toast } from 'sonner';
import { LIMITS } from '@/lib/constants';

export default function ExamUploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // SECURITY: Não receber price via location.state, apenas type
  const { type } = location.state || { type: 'laboratory' };
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useFileUpload();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > LIMITS.MAX_FILE_SIZE) {
      toast.error(`A imagem deve ter no máximo ${LIMITS.MAX_FILE_SIZE_MB}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    const url = await uploadFile(file, 'exam-images');
    if (url) {
      setUploadedImage(url);
      toast.success('Imagem carregada com sucesso!');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContinue = () => {
    // SECURITY: Não passar price via location.state
    navigate('/exams/payment', { 
      state: { 
        type, 
        imageUrl: uploadedImage 
      } 
    });
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-health flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:bg-white/20 active:scale-[0.95] rounded-full transition-all duration-150" style={{ touchAction: 'manipulation' }}>
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">
            Enviar Pedido
          </h1>
          <p className="text-sm text-muted-foreground">Tire uma foto do pedido de exame</p>
        </div>
        <Logo size="sm" showText={false} />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-8">
        <div className="bg-white rounded-3xl shadow-soft p-6 animate-slide-up">
          {/* Instructions */}
          <div className="bg-health-purple/5 rounded-2xl p-4 mb-6">
            <p className="text-sm text-foreground leading-relaxed">
              🔬 <strong>Envie o pedido:</strong> Tire uma foto do pedido médico de exames. Após o pagamento, um médico irá analisar e emitir a guia oficial.
            </p>
          </div>

          {/* Image Preview or Upload Area */}
          <div className="mb-6">
            {previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden shadow-lg">
                <img 
                  src={previewUrl} 
                  alt="Pedido de exame" 
                  className="w-full h-72 object-cover"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-3 right-3 p-2.5 bg-destructive rounded-full shadow-lg active:bg-destructive/90 active:scale-[0.95] transition-all duration-150"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2" />
                      <p className="font-medium">Enviando...</p>
                    </div>
                  </div>
                )}
                {uploadedImage && !isUploading && (
                  <div className="absolute bottom-3 left-3 right-3 bg-health-green/90 rounded-xl p-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <span className="text-health-green text-sm">✓</span>
                    </div>
                    <span className="text-white font-medium text-sm">Imagem carregada com sucesso!</span>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleUploadClick}
                disabled={isUploading}
                className="w-full h-72 rounded-2xl border-2 border-dashed border-health-purple/30 bg-health-purple/5 active:bg-health-purple/10 active:scale-[0.99] transition-all duration-150 flex flex-col items-center justify-center gap-4"
                style={{ touchAction: 'manipulation' }}
              >
                <div className="w-20 h-20 bg-health-purple/10 rounded-2xl flex items-center justify-center">
                  {isUploading ? (
                    <Loader2 className="w-10 h-10 text-health-purple animate-spin" />
                  ) : (
                    <FileImage className="w-10 h-10 text-health-purple" />
                  )}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground mb-1">
                    {isUploading ? 'Carregando...' : 'Toque para enviar foto'}
                  </p>
                  <p className="text-sm text-muted-foreground">JPG, PNG ou HEIC até 10MB</p>
                </div>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleUploadClick}
              disabled={isUploading}
              variant="outline"
              className="w-full h-14 rounded-2xl font-bold border-2 border-health-purple text-health-purple"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5 mr-2" />
                  {previewUrl ? 'Trocar imagem' : 'Tirar foto'}
                </>
              )}
            </Button>

            <Button
              onClick={handleContinue}
              disabled={!uploadedImage || isUploading}
              className="w-full h-14 rounded-2xl font-bold btn-success shadow-lg"
            >
              Continuar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
