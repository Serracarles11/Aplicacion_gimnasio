// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Si solo despliegas en Vercel, puedes incluso quitarla.
  // Sirve para desarrollo local, no para producción.
  allowedDevOrigins: ['http://localhost:3000', 'http://<TU_IP_LOCAL>:3000'],
}

export default nextConfig
