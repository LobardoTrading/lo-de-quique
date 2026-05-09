'use client'

import { useEffect, useRef, useState } from 'react'
import { X, FlashlightOff, Flashlight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [torch, setTorch] = useState(false)

  useEffect(() => {
    let mounted = true

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (!mounted || !scannerRef.current) return

        const scanner = new Html5Qrcode('barcode-reader', { verbose: false })
        html5QrCodeRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 150 }, aspectRatio: 1.5 },
          (decodedText) => {
            onScan(decodedText)
            scanner.stop().catch(() => {})
          },
          () => {}
        )
      } catch {
        if (mounted) setError('No se pudo acceder a la camara. Asegurate de dar permiso.')
      }
    }

    startScanner()
    return () => {
      mounted = false
      if (html5QrCodeRef.current) html5QrCodeRef.current.stop().catch(() => {})
    }
  }, [onScan])

  async function toggleTorch() {
    try {
      const scanner = html5QrCodeRef.current
      if (!scanner) return
      const track = (scanner as unknown as { getRunningTrackCameraCapabilities?: () => { torchFeature: () => { isSupported: () => boolean; apply: (v: boolean) => Promise<void> } } })
        .getRunningTrackCameraCapabilities?.()
      if (track) {
        const tf = track.torchFeature()
        if (tf.isSupported()) {
          const newVal = !torch
          await tf.apply(newVal)
          setTorch(newVal)
        }
      }
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-[60] bg-[var(--bg-main)] flex flex-col">
      <div className="flex items-center justify-between p-4 bg-[#111] border-b border-[var(--border)]">
        <h2 className="text-[var(--text-primary)] text-base font-semibold">Escanear codigo</h2>
        <div className="flex gap-2">
          <button onClick={toggleTorch} className="p-2.5 rounded-lg bg-[var(--bg-card2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            {torch ? <Flashlight size={20} /> : <FlashlightOff size={20} />}
          </button>
          <button onClick={onClose} className="p-2.5 rounded-lg bg-[var(--bg-card2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {error ? (
          <div className="text-center">
            <p className="text-[var(--text-secondary)] mb-4">{error}</p>
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <div id="barcode-reader" ref={scannerRef} className="rounded-[var(--radius)] overflow-hidden" />
            <p className="text-[var(--text-muted)] text-center mt-4 text-sm">
              Apunta al codigo de barras del producto
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
