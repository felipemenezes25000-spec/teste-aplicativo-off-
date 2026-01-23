/**
 * Utilitários de acessibilidade
 */

/**
 * Gera um ID único para elementos ARIA
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Verifica se um elemento está visível na viewport
 */
export function isElementVisible(element: HTMLElement | null): boolean {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Foca em um elemento de forma acessível
 */
export function focusElement(element: HTMLElement | null, options?: FocusOptions): void {
  if (!element) return;

  // Verifica se o elemento está visível antes de focar
  if (!isElementVisible(element)) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Aguarda um pouco para garantir que o scroll terminou
  setTimeout(() => {
    element.focus(options);
  }, 100);
}

/**
 * Navega para o próximo elemento focável
 */
export function focusNextElement(currentElement: HTMLElement): void {
  const focusableElements = getFocusableElements();
  const currentIndex = focusableElements.indexOf(currentElement);

  if (currentIndex < focusableElements.length - 1) {
    focusElement(focusableElements[currentIndex + 1]);
  }
}

/**
 * Navega para o elemento focável anterior
 */
export function focusPreviousElement(currentElement: HTMLElement): void {
  const focusableElements = getFocusableElements();
  const currentIndex = focusableElements.indexOf(currentElement);

  if (currentIndex > 0) {
    focusElement(focusableElements[currentIndex - 1]);
  }
}

/**
 * Retorna todos os elementos focáveis na página
 */
export function getFocusableElements(): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute('disabled') && isElementVisible(el)
  );
}

/**
 * Trapa o foco dentro de um container (útil para modais)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements().filter((el) =>
    container.contains(el)
  );

  if (focusableElements.length === 0) return () => {};

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  firstElement.focus();

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Anuncia uma mensagem para screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';
  announcement.style.clip = 'rect(0, 0, 0, 0)';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
