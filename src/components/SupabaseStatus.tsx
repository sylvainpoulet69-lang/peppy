import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';

export const SupabaseStatus = () => {
  const [status, setStatus] = useState<'checking' | 'ready' | 'degraded'>('checking');

  useEffect(() => {
    const client = getSupabaseClient();
    client
      .from('audit_log')
      .select('count')
      .limit(1)
      .then((res) => {
        if (res.error) {
          setStatus('degraded');
        } else {
          setStatus('ready');
        }
      })
      .catch(() => setStatus('degraded'));
  }, []);

  return (
    <div
      className={`pill flex items-center gap-2 ${
        status === 'ready' ? 'bg-primary text-white' : status === 'checking' ? 'bg-primary-light' : 'bg-amber-100 text-primary-dark'
      }`}
    >
      <span className="w-2 h-2 rounded-full bg-white" aria-hidden />
      <span>{status === 'ready' ? 'Supabase prêt' : status === 'checking' ? 'Vérification' : 'Mode dégradé'}</span>
    </div>
  );
};
