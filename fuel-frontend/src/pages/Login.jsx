import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Fuel, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('manager');
  const [password, setPassword] = useState('manager123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [roleMode, setRoleMode] = useState('MANAGER'); // Just for pre-fill helper

  const handleRoleToggle = (role) => {
    setRoleMode(role);
    if (role === 'MANAGER') {
      setUsername('manager');
      setPassword('manager123');
    } else {
      setUsername('owner');
      setPassword('owner123');
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    setError('');
    setSubmitting(true);
    const result = await login(username, password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle} className="glass-card animate-fade-in">
        {/* Header/Logo */}
        <div style={headerStyle}>
          <div style={logoCircleStyle}>
            <Fuel size={36} color="#10b981" />
          </div>
          <h1 style={titleStyle}>HP Fuel Station</h1>
          <p style={subtitleStyle}>Daily Closing Automation System</p>
        </div>

        {/* Role Helper Selector */}
        <div style={roleToggleContainerStyle}>
          <button
            type="button"
            onClick={() => handleRoleToggle('MANAGER')}
            style={roleButtonStyle(roleMode === 'MANAGER')}
          >
            Manager Account
          </button>
          <button
            type="button"
            onClick={() => handleRoleToggle('OWNER')}
            style={roleButtonStyle(roleMode === 'OWNER')}
          >
            Owner Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={errorAlertStyle}>
            <AlertCircle size={18} color="#f87171" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={formStyle}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <div style={inputContainerStyle}>
              <UserIcon size={18} color="#9ca3af" style={inputIconStyle} />
              <input
                id="username"
                type="text"
                className="form-input"
                style={inputStyle}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={inputContainerStyle}>
              <Lock size={18} color="#9ca3af" style={inputIconStyle} />
              <input
                id="password"
                type="password"
                className="form-input"
                style={inputStyle}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={submitting}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={submitButtonStyle}
            disabled={submitting}
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Inline CSS specific to the Login page
const containerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  width: '100vw',
  background: 'linear-gradient(135deg, #070913 0%, #111827 100%)',
  padding: '1.5rem',
};

const cardStyle = {
  width: '100%',
  maxWidth: '440px',
  padding: '2.5rem',
  background: 'rgba(15, 23, 42, 0.75)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(16, 185, 129, 0.03)',
};

const headerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: '2rem',
  textAlign: 'center',
};

const logoCircleStyle = {
  width: '72px',
  height: '72px',
  borderRadius: '20px',
  background: 'rgba(16, 185, 129, 0.08)',
  border: '1px solid rgba(16, 185, 129, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '1rem',
  boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)',
};

const titleStyle = {
  fontSize: '1.75rem',
  fontWeight: '800',
  color: 'var(--text-main)',
  letterSpacing: '-0.025em',
};

const subtitleStyle = {
  fontSize: '0.9rem',
  color: 'var(--text-muted)',
  marginTop: '0.25rem',
};

const roleToggleContainerStyle = {
  display: 'flex',
  gap: '0.5rem',
  background: 'rgba(0, 0, 0, 0.25)',
  padding: '0.25rem',
  borderRadius: 'var(--radius-sm)',
  marginBottom: '1.5rem',
};

const roleButtonStyle = (isActive) => ({
  flex: 1,
  padding: '0.6rem',
  borderRadius: '6px',
  border: 'none',
  fontSize: '0.85rem',
  fontWeight: '600',
  cursor: 'pointer',
  background: isActive ? '#1e293b' : 'transparent',
  color: isActive ? '#10b981' : '#9ca3af',
  outline: 'none',
  transition: 'all 0.2s ease',
  border: isActive ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid transparent',
});

const errorAlertStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  background: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  borderRadius: 'var(--radius-sm)',
  color: '#f87171',
  fontSize: '0.85rem',
  fontWeight: '500',
  marginBottom: '1.5rem',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
};

const inputContainerStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const inputIconStyle = {
  position: 'absolute',
  left: '12px',
};

const inputStyle = {
  paddingLeft: '38px',
};

const submitButtonStyle = {
  padding: '0.85rem',
  fontSize: '1rem',
  marginTop: '0.5rem',
};

export default Login;
