'use client';

import { useState } from 'react';
import { checkExpiringSubscriptions } from '@/lib/actions/batches';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function CalibrationCheck() {
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      await checkExpiringSubscriptions();
      toast.success('Pulse Check Transmitted', {
        description: 'Synchronized with student alignment status.',
      });
    } catch (error) {
      toast.error('Calibration Failed', {
        description: 'Could not synchronize with the collective resonance.',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-[#1a1a1a] text-white flex items-center justify-between group overflow-hidden relative">
      <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF8A75] mb-1">Calibration</p>
          <p className="text-lg font-serif">Run Pulse Check</p>
      </div>
      <button 
        onClick={handleExecute}
        disabled={isExecuting}
        className="h-10 px-6 rounded-2xl bg-white text-[#1a1a1a] text-[10px] font-black uppercase tracking-widest hover:bg-[#FF8A75] hover:text-white transition-all relative z-10 disabled:opacity-50 flex items-center gap-2"
      >
        {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Execute'}
      </button>
    </div>
  );
}
