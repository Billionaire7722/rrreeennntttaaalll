"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <html>
            <body>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Something went wrong!</h2>
                    <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{error?.message || 'An unexpected error occurred.'}</p>
                    <button
                        onClick={() => reset()}
                        style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
