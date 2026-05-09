'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, X, FlashlightOff, Flashlight } from 'lucide-react'
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
          {
            fps: 10,
            qrbox: { width: 280, height: 150 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            onScan(decodedText)
            scanner.stop().catch(() => {})
          },
          () => {}
        )
      } catch (err) {
        if (mounted) {
          setError('No se pudo acceder a la camara. Asegurate de dar permiso.')
        }
      }
    }

    startScanner()

    return () => {
      mounted = false
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {})
      }
    }
  }, [onScan])

  async function toggleTorch() {
    try {
      const scanner = html5QrCodeRef.current
      if (!scanner) return
      const track = (scanner as unknown as { getRunningTrackCameraCapabilities?: () => { torchFeature: () => { isSupported: () => boolean; apply: (v: boolean) => Promise<void> } } })
        .getRunningTrackCameraCapabilities?.()
      if (track) {
        const torchFeature = track.torchFeature()
        if (torchFeature.isSupported()) {
          const newVal = !torch
          await torchFeature.apply(newVal)
          setTorch(newVal)
        }
      }
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black/80">
        <h2 className="text-white text-xl font-bold">Escanear codigo</h2>
        <div className="flex gap-2">
          <button
            onClick={toggleTorch}
            className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20"
          >
            {torch ? <Flashlight size={24} /> : <FlashlightOff size={24} />}
          </button>
          <button
            onClick={onClose}
            className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {error ? (
          <div className="text-center">
            <p className="text-white text-lg mb-4">{error}</p>
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <div id="barcode-reader" ref={scannerRef} className="rounded-2xl overflow-hidden" />
            <p className="text-white/60 text-center mt-4 text-lg">
              Apunta al codigo de barras del producto
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
