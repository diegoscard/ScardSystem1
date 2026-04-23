import React, { useState, useEffect } from 'react';
import { ShieldCheck as ShieldIcon } from 'lucide-react';
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from '../App';
import { globalStoreData } from '../lib/store';
import { StoreProvider } from '../contexts/StoreContext';

const DataProvider = () => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Carregar dados iniciais
    fetch('/api/sync')
      .then(async (res) => {
         if (!res.ok) {
            const txt = await res.text();
            throw new Error(`HTTP ${res.status} - ${txt}`);
         }
         return res.json();
      })
      .then(data => {
        Object.assign(globalStoreData, data);
        setLoaded(true);
      })
      .catch(e => {
        console.error('Failed to load DB sync', e);
        setError(e instanceof Error ? e.message : String(e));
      });

    // Configurar WebSocket para Sincronização em Tempo Real com Reconexão
    const setupWS = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}`);

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'update') {
            globalStoreData[message.key] = { data: message.data, updatedAt: message.updatedAt };
            window.dispatchEvent(new CustomEvent('store-update', { 
              detail: { key: message.key, data: message.data, updatedAt: message.updatedAt } 
            }));
          }
        } catch (e) {
          console.error("Erro ao processar mensagem WS:", e);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket desconectado. Tentando reconectar em 10 segundos...");
        setTimeout(setupWS, 10000);
      };

      ws.onerror = (err) => {
        console.error("Erro no WebSocket:", err);
        ws.close();
      };

      return ws;
    };

    const wsInstance = setupWS();

    // Polling de fallback (acada 5 segundos) para sincronizar entre diferentes servidores (Vercel vs AI Studio)
    const pollInterval = setInterval(() => {
       fetch('/api/sync')
         .then(res => res.json())
         .then(newData => {
           Object.entries(newData).forEach(([key, value]: [string, any]) => {
             const currentLocal = globalStoreData[key];
             if (!currentLocal || value.updatedAt > (currentLocal.updatedAt || 0)) {
               globalStoreData[key] = value;
               window.dispatchEvent(new CustomEvent('store-update', { 
                 detail: { key, data: value.data, updatedAt: value.updatedAt } 
               }));
             }
           });
         })
         .catch(e => console.warn("Erro no polling de sincronização:", e));
    }, 5000);

    return () => {
      wsInstance.close();
      clearInterval(pollInterval);
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <ShieldIcon size={48} className="text-red-600 mb-4 animate-pulse"/>
        <h1 className="text-white font-black text-xl mb-2">ERRO DE CONEXÃO COM O BANCO</h1>
        <p className="text-zinc-400 text-sm max-w-sm mb-4">
          Não foi possível conectar ao banco de dados Vercel Postgres. 
          Verifique o servidor e o arquivo .env.
        </p>
        <p className="text-red-400 font-mono text-xs max-w-lg break-all bg-red-950/50 p-4 rounded-xl border border-red-900 border-dashed">{error}</p>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col gap-4 items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-red-900 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-red-600/50 text-[10px] uppercase font-black tracking-widest animate-pulse">Sincronizando Banco de Dados...</p>
      </div>
    );
  }

  return (
    <StoreProvider>
      <App />
      <SpeedInsights />
    </StoreProvider>
  );
};

export default DataProvider;
