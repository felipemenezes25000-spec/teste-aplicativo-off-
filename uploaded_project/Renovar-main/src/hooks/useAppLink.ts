/**
 * Hook para tratamento de links externos em contexto de app
 * Detecta ambiente e trata links apropriadamente (in-app browser, deep links, etc.)
 */

import { useNavigate } from 'react-router-dom';

interface UseAppLinkOptions {
  external?: boolean;
  openInAppBrowser?: boolean;
}

export function useAppLink() {
  const navigate = useNavigate();

  /**
   * Detecta se está rodando em Capacitor
   */
  const isCapacitor = (): boolean => {
    return typeof window !== 'undefined' && 
           'Capacitor' in window &&
           (window as { Capacitor?: unknown }).Capacitor !== undefined;
  };

  /**
   * Abre link externo via in-app browser (Capacitor) ou nova aba (web)
   */
  const openExternal = async (url: string, options?: UseAppLinkOptions) => {
    if (isCapacitor() && options?.openInAppBrowser) {
      // Em Capacitor, usar Browser plugin para in-app browser
      try {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url });
      } catch (error) {
        // Fallback para window.open se plugin não disponível
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else {
      // Em web, abrir em nova aba
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  /**
   * Abre WhatsApp via deep link com fallback
   */
  const openWhatsApp = (phone: string, message?: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const text = message ? encodeURIComponent(message) : '';
    const whatsappUrl = `https://wa.me/55${cleanPhone}${text ? `?text=${text}` : ''}`;
    
    // Tentar deep link primeiro (funciona melhor em mobile)
    const deepLink = `whatsapp://send?phone=55${cleanPhone}${text ? `&text=${text}` : ''}`;
    
    // Em mobile, tentar deep link primeiro
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      const link = document.createElement('a');
      link.href = deepLink;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Fallback após timeout se deep link não funcionar
      setTimeout(() => {
        openExternal(whatsappUrl, { openInAppBrowser: true });
      }, 500);
    } else {
      // Desktop: abrir diretamente
      openExternal(whatsappUrl);
    }
  };

  /**
   * Navega para rota interna
   */
  const navigateTo = (path: string) => {
    navigate(path);
  };

  /**
   * Trata link genérico (interno ou externo)
   */
  const handleLink = (url: string, options?: UseAppLinkOptions) => {
    // Links internos (começam com /)
    if (url.startsWith('/')) {
      navigateTo(url);
      return;
    }

    // Links externos
    openExternal(url, options);
  };

  return {
    openExternal,
    openWhatsApp,
    navigateTo,
    handleLink,
    isCapacitor: isCapacitor(),
  };
}
