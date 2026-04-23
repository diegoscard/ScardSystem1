import React, { useState, useEffect, useRef } from 'react';
import { globalStoreData } from '../lib/store';

export const usePersistedState = <T,>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const lastSyncRef = useRef<number>(globalStoreData[key]?.updatedAt || 0);
  
  const [state, setState] = useState<T>(() => {
    // Prioridade: Banco de Dados PG (via globalStoreData)
    const storedItem = globalStoreData[key];
    let stored = storedItem ? JSON.stringify(storedItem.data) : null;
    
    try {
      if (!stored) return initial;
      const parsed = JSON.parse(stored);
      if (key === 'db_settings') {
        const initialAny = initial as any;
        return { ...initial, ...parsed, cardFees: { ...initialAny.cardFees, ...(parsed.cardFees || {}) } } as T;
      }
      return parsed;
    } catch (e) {
      return initial;
    }
  });

  const isFirstRender = useRef(true);
  const isRemoteUpdate = useRef(false);

  // Escutar atualizações via WebSocket enviadas pelo DataProvider
  useEffect(() => {
    const handleStoreUpdate = (e: any) => {
      if (e.detail.key === key) {
        if (e.detail.updatedAt > lastSyncRef.current) {
          lastSyncRef.current = e.detail.updatedAt;
          isRemoteUpdate.current = true;
          setState(e.detail.data);
        }
      }
    };
    window.addEventListener('store-update' as any, handleStoreUpdate);
    return () => window.removeEventListener('store-update' as any, handleStoreUpdate);
  }, [key]);

  useEffect(() => { 
    // Sincronizar EXCLUSIVAMENTE com banco de dados Vercel Postgres em background
    if (!isFirstRender.current) {
      if (isRemoteUpdate.current) {
        // Se foi uma atualização remota (WS), apenas resetamos a flag e não enviamos de volta
        isRemoteUpdate.current = false;
        return;
      }

      fetch(`/api/sync/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      })
      .then(res => res.json())
      .then(res => {
        if (res.updatedAt) lastSyncRef.current = res.updatedAt;
      })
      .catch(err => console.error("Erro sincronizando DB Postgres", key, err));
    }
    isFirstRender.current = false;
  }, [key, state]);

  return [state, setState];
};
