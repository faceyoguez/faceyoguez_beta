import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#FAF9F6]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#10b981]" />
        <p className="text-gray-500 font-medium">Loading your space...</p>
      </div>
    </div>
  );
}
