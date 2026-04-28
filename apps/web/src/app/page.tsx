import React from 'react';
export default function Home() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Bilnov Live</h1>
      <p>Système de suivi de chantier opérationnel.</p>
      <a href="/public/access" style={{ color: 'blue' }}>Accéder au portail client</a>
    </main>
  );
}