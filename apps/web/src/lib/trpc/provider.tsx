"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { api } from "./client";
import { handleTRPCError, classifyTRPCError } from "./error-handler";
import { logger } from "@/lib/logger";

// Interceptar console.error para silenciar errores PAYMENT_REQUIRED y UNAUTHORIZED
// NOTA: Esta interceptación puede causar un warning de deprecación de React Query,
// pero es necesario para silenciar errores esperados de créditos insuficientes y autenticación.
// El warning no afecta la funcionalidad y se puede ignorar de forma segura.
if (typeof window !== 'undefined' && !(console.error as { __intercepted?: boolean }).__intercepted) {
  const originalConsoleError = console.error;
  const interceptedConsoleError = (...args: unknown[]) => {
    // Verificar si alguno de los argumentos contiene un error PAYMENT_REQUIRED, UNAUTHORIZED o NETWORK
    const hasExpectedError = args.some(arg => {
      if (arg instanceof Error) {
        const errorInfo = classifyTRPCError(arg);
        return errorInfo.type === 'payment-required' || 
               errorInfo.type === 'unauthorized' || 
               errorInfo.type === 'network';
      }
      if (arg && typeof arg === 'object') {
        try {
          const argStr = JSON.stringify(arg);
          // Verificar PAYMENT_REQUIRED
          if (argStr.includes('PAYMENT_REQUIRED') || 
              argStr.includes('402 Payment Required') ||
              argStr.includes('Créditos insuficientes')) {
            return true;
          }
          // Verificar UNAUTHORIZED
          if (argStr.includes('UNAUTHORIZED') || 
              argStr.includes('401 Unauthorized') ||
              argStr.includes('must be logged in') ||
              argStr.includes('You must be logged in') ||
              argStr.includes('No autenticado')) {
            return true;
          }
          // Verificar NETWORK (Failed to fetch)
          if (argStr.includes('Failed to fetch') || 
              argStr.includes('failed to fetch') ||
              argStr.includes('NetworkError') ||
              argStr.includes('network error')) {
            return true;
          }
          // Verificar por errorInfo.type
          if (argStr.includes('"type":"payment-required"') || 
              argStr.includes('"type":"unauthorized"') ||
              argStr.includes('"type":"network"')) {
            return true;
          }
          return false;
        } catch {
          // Si falla la serialización, verificar propiedades directamente
          const errorObj = arg as Record<string, unknown>;
          if (errorObj.message && typeof errorObj.message === 'string') {
            // Verificar PAYMENT_REQUIRED
            if (errorObj.message.includes('PAYMENT_REQUIRED') || 
                errorObj.message.includes('402 Payment Required') ||
                errorObj.message.includes('Créditos insuficientes')) {
              return true;
            }
            // Verificar UNAUTHORIZED
            if (errorObj.message.includes('UNAUTHORIZED') || 
                errorObj.message.includes('401 Unauthorized') ||
                errorObj.message.includes('must be logged in') ||
                errorObj.message.includes('You must be logged in') ||
                errorObj.message.includes('No autenticado')) {
              return true;
            }
            // Verificar NETWORK (Failed to fetch)
            if (errorObj.message.includes('Failed to fetch') || 
                errorObj.message.includes('failed to fetch') ||
                errorObj.message.includes('NetworkError') ||
                errorObj.message.includes('network error')) {
              return true;
            }
          }
          // Verificar errorInfo.type directamente
          if (errorObj.errorInfo && typeof errorObj.errorInfo === 'object') {
            const errorInfo = errorObj.errorInfo as Record<string, unknown>;
            if (errorInfo.type === 'payment-required' || 
                errorInfo.type === 'unauthorized' || 
                errorInfo.type === 'network') {
              return true;
            }
          }
          // Verificar status 401 o 402
          if (errorObj.status === 401 || errorObj.status === 402) {
            return true;
          }
          return false;
        }
      }
      if (typeof arg === 'string') {
        // Verificar PAYMENT_REQUIRED
        if (arg.includes('PAYMENT_REQUIRED') || 
            arg.includes('402 Payment Required') ||
            arg.includes('Créditos insuficientes')) {
          return true;
        }
        // Verificar UNAUTHORIZED
        if (arg.includes('UNAUTHORIZED') || 
            arg.includes('401 Unauthorized') ||
            arg.includes('must be logged in') ||
            arg.includes('You must be logged in') ||
            arg.includes('No autenticado')) {
          return true;
        }
        // Verificar NETWORK (Failed to fetch)
        if (arg.includes('Failed to fetch') || 
            arg.includes('failed to fetch') ||
            arg.includes('NetworkError') ||
            arg.includes('network error')) {
          return true;
        }
      }
      return false;
    });
    
    // Si es un error esperado (PAYMENT_REQUIRED o UNAUTHORIZED), no loggearlo
    if (hasExpectedError) {
      return;
    }
    
    // Para otros errores, usar console.error normal
    originalConsoleError.apply(console, args);
  };
  
  // Marcar como interceptado para evitar múltiples interceptaciones
  (interceptedConsoleError as { __intercepted?: boolean }).__intercepted = true;
  console.error = interceptedConsoleError;
}

function getBaseUrl() {
  if (typeof window !== "undefined") {
    // En el cliente: origen explícito (evita "Failed to fetch" en iframes/base tags)
    return window.location.origin;
  }
  if (process.env["VERCEL_URL"]) return `https://${process.env["VERCEL_URL"]}`;
  return `http://localhost:${process.env["PORT"] ?? 3000}`;
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              const errorInfo = classifyTRPCError(error);
              if (errorInfo.shouldRetry && failureCount < 3) {
                return true;
              }
              return false;
            },
            retryDelay: (attemptIndex) => {
              return Math.min(1000 * Math.pow(2, attemptIndex), 10000);
            },
            // Silenciar errores PAYMENT_REQUIRED, UNAUTHORIZED y NETWORK en la consola (son esperados o temporales)
            // La interceptación global de console.error ya los maneja
            onError: (error) => {
              const errorInfo = classifyTRPCError(error);
              if (errorInfo.type !== 'payment-required' &&
                  errorInfo.type !== 'unauthorized' &&
                  errorInfo.type !== 'network' &&
                  errorInfo.type !== 'not-found') {
                // Solo loggear errores que NO son payment-required, unauthorized, network ni not-found
                logger.error('[React Query] Query error:', error);
              }
            },
          },
          mutations: {
            // Silenciar errores PAYMENT_REQUIRED, UNAUTHORIZED y NETWORK en la consola (son esperados o temporales)
            // La interceptación global de console.error ya los maneja
            onError: (error) => {
              const errorInfo = classifyTRPCError(error);
              if (errorInfo.type !== 'payment-required' &&
                  errorInfo.type !== 'unauthorized' &&
                  errorInfo.type !== 'network' &&
                  errorInfo.type !== 'not-found') {
                // Solo loggear errores que NO son payment-required, unauthorized, network ni not-found
                logger.error('[React Query] Mutation error:', error);
              }
            },
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          fetch: async (url, options) => {
            try {
              const response = await fetch(url, {
                ...options,
                credentials: "include", // Incluir cookies para autenticación
                signal: AbortSignal.timeout(60000), // 60 segundos timeout (aumentado para queries pesadas)
              });
              
              // Si la respuesta no es OK, manejar el error
              if (!response.ok) {
                const errorText = await response.text().catch(() => "Unknown error");
                
                // Intentar parsear el error como JSON si es posible
                let parsedError: unknown = errorText;
                try {
                  parsedError = JSON.parse(errorText);
                } catch {
                  // Si no es JSON, usar el texto tal cual
                  // Si es HTML (página de error de Next.js), intentar extraer información
                  if (typeof errorText === 'string' && errorText.includes('<!DOCTYPE html>')) {
                    parsedError = {
                      type: 'html_error_page',
                      message: 'El servidor devolvió una página de error HTML en lugar de JSON',
                      statusCode: response.status,
                    };
                  }
                }
                
                // Clasificar el error ANTES de crearlo para determinar si debemos lanzarlo
              // Si es un error de red (Failed to fetch), silenciarlo
              const isNetworkError = errorText.toLowerCase().includes('failed to fetch') || 
                                     response.status === 0 || 
                                     response.status >= 500;
              
              if (isNetworkError) {
                // Crear un error de red que será silenciado por el error handler
                const networkError = new Error('Failed to fetch');
                networkError.name = 'NetworkError';
                throw networkError;
              }
                // Esto permite detectar errores de autenticación antes de crear el objeto Error
                let errorCode: string | undefined
                let errorMessage = ''
                
                // Extraer información del error para clasificación
                try {
                  if (Array.isArray(parsedError) && parsedError.length > 0) {
                    const firstError = parsedError[0] as Record<string, unknown>;
                    if (firstError.error && typeof firstError.error === 'object') {
                      const errorData = firstError.error as Record<string, unknown>;
                      if (errorData.json && typeof errorData.json === 'object') {
                        const jsonData = errorData.json as Record<string, unknown>;
                        errorMessage = (jsonData.message as string) || ''
                        
                        if (jsonData.data && typeof jsonData.data === 'object') {
                          errorCode = (jsonData.data as Record<string, unknown>)?.code as string
                        }
                        if (!errorCode && jsonData.code) {
                          errorCode = jsonData.code as string
                        }
                      }
                    }
                  }
                } catch {
                  // Si falla la extracción, continuar con valores por defecto
                }
                
                // Detectar si es UNAUTHORIZED ANTES de crear el error
                const isUnauthorizedBeforeError = response.status === 401 || 
                                                  errorCode === 'UNAUTHORIZED' ||
                                                  (typeof errorMessage === 'string' && (
                                                    errorMessage.includes('must be logged in') || 
                                                    errorMessage.includes('UNAUTHORIZED') ||
                                                    errorMessage.includes('You must be logged in')
                                                  ))
                
                // Clasificar y manejar el error
                const error = new Error(`tRPC request failed: ${response.status} ${response.statusText}`);
                (error as Record<string, unknown>).status = response.status;
                (error as Record<string, unknown>).statusText = response.statusText;
                (error as Record<string, unknown>).responseBody = parsedError;
                // Añadir errorCode al error para que classifyTRPCError lo detecte
                if (errorCode) {
                  (error as Record<string, unknown>).code = errorCode
                  // También añadir a data.code (formato tRPC)
                  if (!(error as Record<string, unknown>).data) {
                    (error as Record<string, unknown>).data = {}
                  }
                  ((error as Record<string, unknown>).data as Record<string, unknown>).code = errorCode
                }
                
                // Usar la detección previa de isUnauthorized
                const isUnauthorized = isUnauthorizedBeforeError
                
                // Detectar si es un error PAYMENT_REQUIRED (402)
                let isPaymentRequired = false
                try {
                  if (Array.isArray(parsedError) && parsedError.length > 0) {
                    const firstError = parsedError[0] as Record<string, unknown>;
                    if (firstError.error && typeof firstError.error === 'object') {
                      const errorData = firstError.error as Record<string, unknown>;
                      if (errorData.json && typeof errorData.json === 'object') {
                        const jsonData = errorData.json as Record<string, unknown>;
                        const msg = (jsonData.message as string) || ''
                        
                        // Detectar PAYMENT_REQUIRED desde múltiples fuentes
                        isPaymentRequired = response.status === 402 || 
                                         errorCode === 'PAYMENT_REQUIRED' ||
                                         msg.includes('Créditos insuficientes') ||
                                         msg.includes('PAYMENT_REQUIRED') ||
                                         msg.toLowerCase().includes('payment required')
                      }
                    }
                  }
                } catch (extractError) {
                  // Si falla la extracción, verificar al menos por status code
                  if (response.status === 402) {
                    isPaymentRequired = true
                  }
                }

                // Si es PAYMENT_REQUIRED, estructurar el error para que classifyTRPCError lo detecte correctamente
                if (isPaymentRequired) {
                  // Asegurar que el error tenga la estructura correcta para classifyTRPCError
                  if (!errorCode) {
                    errorCode = 'PAYMENT_REQUIRED'
                    (error as Record<string, unknown>).code = errorCode
                    if (!(error as Record<string, unknown>).data) {
                      (error as Record<string, unknown>).data = {}
                    }
                    ((error as Record<string, unknown>).data as Record<string, unknown>).code = errorCode
                  }
                  
                  // Añadir cause con status para que classifyTRPCError lo detecte
                  if (!(error as Record<string, unknown>).cause) {
                    (error as Record<string, unknown>).cause = {
                      status: 402,
                      statusText: 'Payment Required',
                      responseBody: parsedError,
                    }
                  }
                  
                  // Errores de créditos insuficientes son esperados - NO loggear para evitar spam en consola
                  // El error handler lo manejará silenciosamente
                } else if (isUnauthorized) {
                  // Errores de autenticación son esperados cuando el usuario no está autenticado
                  // No loggear para evitar spam en la consola
                  // Estos errores se manejan con el flag `enabled` en los queries
                } else {
                  // Otros errores - loggear como error para debugging
                  logger.error("[tRPC] Request failed:", {
                    url: url.toString(),
                    status: response.status,
                    statusText: response.statusText,
                    responseBody: parsedError,
                    responseBodyType: typeof parsedError,
                    responseBodyIsArray: Array.isArray(parsedError),
                    responseBodyString: typeof parsedError === 'string' 
                      ? parsedError.substring(0, 500) 
                      : JSON.stringify(parsedError).substring(0, 500),
                  });
                  
                  // Intentar extraer el mensaje del error para logging adicional
                  try {
                    if (Array.isArray(parsedError) && parsedError.length > 0) {
                      const firstError = parsedError[0] as Record<string, unknown>;
                      if (firstError.error && typeof firstError.error === 'object') {
                        const errorData = firstError.error as Record<string, unknown>;
                        if (errorData.json && typeof errorData.json === 'object') {
                          const jsonData = errorData.json as Record<string, unknown>;
                          if (jsonData.message && typeof jsonData.message === 'string') {
                            // Solo loggear errores que NO son de autenticación esperados
                            // (isUnauthorized ya se verificó arriba, pero verificamos el mensaje también)
                            const isUnauthorizedMessage = jsonData.message.includes('must be logged in') || 
                                                          jsonData.message.includes('UNAUTHORIZED') ||
                                                          errorCode === 'UNAUTHORIZED'
                            
                            if (!isUnauthorizedMessage && !isUnauthorized) {
                              logger.error("[tRPC] Server error message:", { 
                                serverMessage: jsonData.message,
                                path: jsonData.path || 'unknown'
                              });
                            }
                          }
                        }
                      }
                    }
                  } catch (extractError) {
                    // Si falla la extracción, no hacer nada (ya verificamos isUnauthorized arriba)
                  }
                  
                  // Solo llamar a handleTRPCError para errores que NO son PAYMENT_REQUIRED ni UNAUTHORIZED
                  if (!isUnauthorized && !isPaymentRequired) {
                    handleTRPCError(error, `Request to ${url}`);
                  }
                }
                
                // Lanzar el error (pero handleTRPCError ya lo habrá manejado si no es UNAUTHORIZED)
                throw error;
              }
              
              return response;
            } catch (error) {
              // Clasificar el error antes de llamar a handleTRPCError
              const errorInfo = classifyTRPCError(error)
              
              // Solo llamar a handleTRPCError si NO es UNAUTHORIZED, PAYMENT_REQUIRED ni NETWORK
              if (errorInfo.type !== 'unauthorized' && 
                  errorInfo.type !== 'payment-required' && 
                  errorInfo.type !== 'network') {
                if (error instanceof Error) {
                  if (error.name === 'AbortError' || error.message.includes('timeout')) {
                    handleTRPCError(new Error('Request timeout'), `Request to ${url}`);
                  } else {
                    handleTRPCError(error, `Request to ${url}`);
                  }
                } else {
                  handleTRPCError(error, `Request to ${url}`);
                }
              }
              throw error;
            }
          },
        }),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}
