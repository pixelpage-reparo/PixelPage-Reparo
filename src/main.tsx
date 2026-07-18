import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// No-op during `npm run dev` (devOptions.enabled is false) — only active
// against the production build, where the service worker actually exists.
registerSW({
  immediate: true,
  onNeedRefresh() {
    toast('Nova versão disponível', {
      description: 'Atualize pra pegar as últimas melhorias da Bancada.',
      duration: Infinity,
      action: {
        label: 'Atualizar',
        onClick: () => window.location.reload(),
      },
    })
  },
  onOfflineReady() {
    toast.success('Pronto pra uso offline (leitura).')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
