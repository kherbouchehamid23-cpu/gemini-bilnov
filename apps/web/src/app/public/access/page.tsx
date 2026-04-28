'use client';
import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export default function PublicAccess() {
  const [code, setCode] = useState<string[]>([]);
  const handleKey = (n: string) => code.length < 6 && setCode([...code, n]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
          <Lock />
        </div>
        <h1 className="text-2xl font-bold">Accès Bilnov</h1>
      </div>
      <div className="flex gap-2 mb-10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-10 h-14 border-2 rounded-xl flex items-center justify-center text-xl bg-white shadow-sm font-bold">
            {code[i] ? '•' : ''}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3,4,5,6,7,8,9,0].map(n => (
          <button key={n} onClick={() => handleKey(n.toString())} className="w-16 h-16 rounded-full bg-white shadow font-bold text-xl hover:bg-gray-100 active:scale-95 transition-all">
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}