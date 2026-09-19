import 'server-only';

export class UntrustedOriginError extends Error {
  constructor() {
    super('untrusted_request_origin');
    this.name = 'UntrustedOriginError';
  }
}

export function getTrustedAppBaseUrl(request: Request): string {
  const configuredValue = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredValue) {
    const configuredUrl = new URL(configuredValue);
    if (process.env.NODE_ENV === 'production' && configuredUrl.protocol !== 'https:') {
      throw new Error('app_url_must_use_https');
    }
    return configuredUrl.origin;
  }

  if (process.env.NODE_ENV !== 'production') {
    return new URL(request.url).origin;
  }

  // Em produção, nunca constrói links sensíveis com Host/X-Forwarded-Host
  // fornecidos pela requisição. O domínio precisa estar explicitamente
  // configurado na Vercel.
  throw new Error('app_url_not_configured');
}

export function assertTrustedOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  const trustedOrigin = getTrustedAppBaseUrl(request);

  try {
    if (!origin || new URL(origin).origin !== trustedOrigin) {
      throw new UntrustedOriginError();
    }
  } catch (error) {
    if (error instanceof UntrustedOriginError) throw error;
    throw new UntrustedOriginError();
  }
}
