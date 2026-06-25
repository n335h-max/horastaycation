import { useState, useEffect } from 'react';
import { INSTALL_PROMPT_EVENT } from '../lib/constants';

export function usePwaInstall() {
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferredInstallPrompt(event);
    }

    window.addEventListener(INSTALL_PROMPT_EVENT, handleBeforeInstallPrompt);
    return () => window.removeEventListener(INSTALL_PROMPT_EVENT, handleBeforeInstallPrompt);
  }, []);

  const canInstallApp = Boolean(deferredInstallPrompt);

  async function handleInstallApp(pushToast, recordAnalytics) {
    if (!deferredInstallPrompt) {
      pushToast?.('This browser can still install Hora from its share or menu options.', 'info', 'mobile');
      return;
    }

    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    setDeferredInstallPrompt(null);
    await recordAnalytics?.('install_prompt', { outcome: choice.outcome });

    pushToast?.(
      choice.outcome === 'accepted' ? 'Hora was added to your device.' : 'Install prompt dismissed.',
      choice.outcome === 'accepted' ? 'success' : 'info',
      'download',
    );
  }

  return {
    deferredInstallPrompt,
    canInstallApp,
    handleInstallApp,
  };
}
