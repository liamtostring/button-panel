'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/types';

export default function PanelPage() {
  const [buttons, setButtons] = useState<Button[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      setUsername(data.username);
      loadButtons();
    } catch (err) {
      router.push('/login');
    }
  };

  const loadButtons = async () => {
    try {
      const response = await fetch('/api/buttons');
      if (!response.ok) {
        throw new Error('Error al cargar botones');
      }

      const data = await response.json();
      setButtons(data);
    } catch (err) {
      setError('Error al cargar botones');
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = async (buttonId: string) => {
    setTriggeringId(buttonId);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ buttonId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al ejecutar webhook');
      } else {
        // Show success message from webhook
        if (data.message) {
          setSuccessMessage(data.message);
          // Auto-clear success message after 5 seconds
          setTimeout(() => setSuccessMessage(''), 5000);
        }
      }
    } catch (err) {
      setError('Error al ejecutar webhook');
    } finally {
      setTriggeringId(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          background: 'rgba(255,255,255,0.95)',
          padding: '20px 30px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#333',
              margin: 0,
            }}>
              Panel de Botones
            </h1>
            <p style={{
              color: '#666',
              margin: '5px 0 0 0',
            }}>
              Bienvenido, {username}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Cerrar Sesión
          </button>
        </div>

        {error && (
          <div style={{
            padding: '15px',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '5px',
            color: '#c33',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{
            padding: '15px',
            background: '#d1fae5',
            border: '1px solid #6ee7b7',
            borderRadius: '5px',
            color: '#065f46',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: '600',
          }}>
            {successMessage}
          </div>
        )}

        {buttons.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '10px',
            textAlign: 'center',
            color: '#666',
          }}>
            No hay botones configurados aún. Contacta a tu administrador.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '20px',
          }}>
            {buttons.map((button) => (
              <button
                key={button.id}
                onClick={() => handleButtonClick(button.id)}
                disabled={triggeringId === button.id}
                style={{
                  padding: '30px 20px',
                  background: button.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: triggeringId === button.id ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  opacity: triggeringId === button.id ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (triggeringId !== button.id) {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                }}
              >
                {triggeringId === button.id ? 'Ejecutando...' : button.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
