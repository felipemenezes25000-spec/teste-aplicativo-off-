import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * Componente que exibe o status da conexão em tempo real do Supabase
 */
export function RealtimeStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [channelCount, setChannelCount] = useState(0);

  useEffect(() => {
    // Verifica o status da conexão periodicamente
    const checkConnection = () => {
      const channels = supabase.getChannels();
      const connectedChannels = channels.filter(
        (ch) => ch.state === 'joined' || ch.state === 'joining'
      );
      
      setChannelCount(connectedChannels.length);
      setIsConnected(connectedChannels.length > 0);
    };

    // Verifica imediatamente
    checkConnection();

    // Verifica a cada 2 segundos
    const interval = setInterval(checkConnection, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!isConnected) {
    return (
      <Badge variant="destructive" className="gap-1">
        <WifiOff className="h-3 w-3" />
        <span className="hidden sm:inline">Desconectado</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
      <Wifi className="h-3 w-3" />
      <span className="hidden sm:inline">Tempo Real</span>
      {channelCount > 0 && (
        <span className="text-xs">({channelCount})</span>
      )}
    </Badge>
  );
}
