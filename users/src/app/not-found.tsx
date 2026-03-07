"use client";

export default function NotFound() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 800, color: '#1d4ed8', margin: 0 }}>404</h1>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginTop: '1rem' }}>Page Not Found</h2>
            <p style={{ color: '#6b7280', marginTop: '0.5rem', marginBottom: '2rem' }}>The page you are looking for does not exist.</p>
            <a href="/" style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: '#fff', borderRadius: '0.75rem', textDecoration: 'none', fontWeight: 600 }}>
                Go Home
            </a>
        </div>
    );
}
