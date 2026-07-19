import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { EnvValidationError, validateEnv } from './lib/env'

/**
 * Renders straight into the DOM (no React) since the point is to work even
 * if the app itself never gets a chance to boot. Uses textContent, not
 * innerHTML, so there's no escaping to get wrong.
 */
function renderFatalError(message: string) {
  const root = document.getElementById('root')
  if (!root) return

  root.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.style.cssText =
    'font-family: system-ui, sans-serif; max-width: 640px; margin: 10vh auto; padding: 24px; ' +
    'border: 1px solid #f2b8b5; border-radius: 12px; background: #fff5f5; color: #7a271a;'

  const heading = document.createElement('h1')
  heading.style.cssText = 'font-size: 18px; margin: 0 0 12px; font-weight: 700;'
  heading.textContent = 'Bancada não conseguiu iniciar'

  const pre = document.createElement('pre')
  pre.style.cssText =
    'white-space: pre-wrap; font-size: 13px; font-family: ui-monospace, SFMono-Regular, monospace; margin: 0;'
  pre.textContent = message

  wrapper.append(heading, pre)
  root.append(wrapper)
}

async function bootstrap() {
  // Validated first, before anything else (including App.tsx, which pulls
  // in the Supabase client) is even imported — a missing/invalid
  // VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY fails loudly right here
  // instead of the app quietly rendering and every query hanging later.
  try {
    validateEnv()
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error(error.message)
      renderFatalError(error.message)
      return
    }
    throw error
  }

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

  const { default: App } = await import('./App.tsx')

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
