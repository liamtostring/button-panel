'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, COLORS } from '@/types';

interface User {
  username: string;
  isAdmin: boolean;
}

export default function AdminPage() {
  const [buttons, setButtons] = useState<Button[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'buttons' | 'users'>('buttons');
  const router = useRouter();

  // Button form state
  const [editingButton, setEditingButton] = useState<Button | null>(null);
  const [buttonForm, setButtonForm] = useState({
    label: '',
    webhook: '',
    color: COLORS[0].value,
  });

  // User form state
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
  });

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
      if (!data.isAdmin) {
        router.push('/panel');
        return;
      }

      loadData();
    } catch (err) {
      router.push('/login');
    }
  };

  const loadData = async () => {
    try {
      const [buttonsRes, usersRes] = await Promise.all([
        fetch('/api/buttons'),
        fetch('/api/users'),
      ]);

      if (buttonsRes.ok) {
        const buttonsData = await buttonsRes.json();
        setButtons(buttonsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleButtonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingButton
        ? `/api/buttons/${editingButton.id}`
        : '/api/buttons';

      const method = editingButton ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...buttonForm,
          order: editingButton?.order ?? Date.now(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save button');
      }

      setButtonForm({ label: '', webhook: '', color: COLORS[0].value });
      setEditingButton(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditButton = (button: Button) => {
    setEditingButton(button);
    setButtonForm({
      label: button.label,
      webhook: button.webhook,
      color: button.color,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteButton = async (id: string) => {
    if (!confirm('Are you sure you want to delete this button?')) return;

    try {
      const response = await fetch(`/api/buttons/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete button');
      }

      loadData();
    } catch (err) {
      setError('Failed to delete button');
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }

      setUserForm({ username: '', password: '' });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;

    try {
      const response = await fetch(`/api/users/${username}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      loadData();
    } catch (err) {
      setError('Failed to delete user');
    }
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
        <div style={{ fontSize: '18px', color: '#666' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          background: 'white',
          padding: '20px 30px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#333',
            margin: 0,
          }}>
            Admin Panel
          </h1>
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
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
        }}>
          <button
            onClick={() => setActiveTab('buttons')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'buttons' ? '#3b82f6' : 'white',
              color: activeTab === 'buttons' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            }}
          >
            Buttons
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'users' ? '#3b82f6' : 'white',
              color: activeTab === 'users' ? 'white' : '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            }}
          >
            Users
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

        {/* Buttons Tab */}
        {activeTab === 'buttons' && (
          <>
            {/* Button Form */}
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '10px',
              marginBottom: '20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '20px',
                color: '#333',
              }}>
                {editingButton ? 'Edit Button' : 'Add New Button'}
              </h2>

              <form onSubmit={handleButtonSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '5px',
                    color: '#333',
                    fontWeight: '500',
                  }}>
                    Label
                  </label>
                  <input
                    type="text"
                    value={buttonForm.label}
                    onChange={(e) => setButtonForm({ ...buttonForm, label: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '5px',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Button label"
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '5px',
                    color: '#333',
                    fontWeight: '500',
                  }}>
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={buttonForm.webhook}
                    onChange={(e) => setButtonForm({ ...buttonForm, webhook: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '5px',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                    }}
                    placeholder="https://example.com/webhook"
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '5px',
                    color: '#333',
                    fontWeight: '500',
                  }}>
                    Color
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: '10px',
                  }}>
                    {COLORS.map((color) => (
                      <label
                        key={color.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          padding: '10px',
                          border: buttonForm.color === color.value ? '2px solid #333' : '2px solid #e0e0e0',
                          borderRadius: '5px',
                        }}
                      >
                        <input
                          type="radio"
                          name="color"
                          value={color.value}
                          checked={buttonForm.color === color.value}
                          onChange={(e) => setButtonForm({ ...buttonForm, color: e.target.value })}
                          style={{ display: 'none' }}
                        />
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            background: color.value,
                            marginRight: '8px',
                          }}
                        />
                        <span style={{ fontSize: '14px' }}>{color.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                  >
                    {editingButton ? 'Update Button' : 'Add Button'}
                  </button>

                  {editingButton && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingButton(null);
                        setButtonForm({ label: '', webhook: '', color: COLORS[0].value });
                      }}
                      style={{
                        padding: '12px 24px',
                        background: '#999',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Buttons List */}
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '20px',
                color: '#333',
              }}>
                Existing Buttons ({buttons.length})
              </h2>

              {buttons.length === 0 ? (
                <p style={{ color: '#666' }}>No buttons yet. Create your first button above.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {buttons.map((button) => (
                    <div
                      key={button.id}
                      style={{
                        padding: '20px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '5px',
                              background: button.color,
                            }}
                          />
                          <strong style={{ fontSize: '18px' }}>{button.label}</strong>
                        </div>
                        <div style={{ color: '#666', fontSize: '14px', wordBreak: 'break-all' }}>
                          {button.webhook}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handleEditButton(button)}
                          style={{
                            padding: '8px 16px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: '500',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteButton(button.id)}
                          style={{
                            padding: '8px 16px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: '500',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            {/* User Form */}
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '10px',
              marginBottom: '20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '20px',
                color: '#333',
              }}>
                Add New User
              </h2>

              <form onSubmit={handleUserSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '5px',
                    color: '#333',
                    fontWeight: '500',
                  }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '5px',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Username"
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '5px',
                    color: '#333',
                    fontWeight: '500',
                  }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '5px',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Password"
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Add User
                </button>
              </form>
            </div>

            {/* Users List */}
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '20px',
                color: '#333',
              }}>
                Existing Users ({users.length})
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {users.map((user) => (
                  <div
                    key={user.username}
                    style={{
                      padding: '20px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '18px' }}>{user.username}</strong>
                      {user.isAdmin && (
                        <span style={{
                          marginLeft: '10px',
                          padding: '4px 8px',
                          background: '#3b82f6',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}>
                          ADMIN
                        </span>
                      )}
                    </div>
                    {!user.isAdmin && (
                      <button
                        onClick={() => handleDeleteUser(user.username)}
                        style={{
                          padding: '8px 16px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontWeight: '500',
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
