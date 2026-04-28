'use client';
import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export default function PublicAccess() {
  const [code, setCode] = useState([]);
  const handleKey = (n) => code.length < 6 && setCode([...code, n]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-sans">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
          <Lock />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Accès Bilnov</h1>
        <p className="text-gray-500">Saisissez votre code à 6 chiffres</p>
      </div>
      <div className="flex gap-3 mb-10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-12 h-16 border-2 border-gray-200 rounded-xl flex items-center justify-center text-2xl font-bold bg-white shadow-sm">
            {code[i] ? '•' : ''}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => handleKey(n.toString())} className="h-16 rounded-full bg-white shadow active:bg-gray-100 font-bold text-xl text-gray-700">
            {n}
          </button>
        ))}
        <div />
        <button onClick={() => handleKey('0')} className="h-16 rounded-full bg-white shadow active:bg-gray-100 font-bold text-xl text-gray-700">0</button>
      </div>
    </div>
  );
}