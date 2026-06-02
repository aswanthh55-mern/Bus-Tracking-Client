import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, Mail, User, ArrowRight, Info } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('User');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  // Redirect to Dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.message);
        setLoading(false);
      } else {
        navigate('/');
      }
    } else {
      if (!username) {
        setError('Please enter a username');
        setLoading(false);
        return;
      }
      const result = await register(username, email, password, role);
      if (!result.success) {
        setError(result.message);
        setLoading(false);
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '40px',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Glow Effects */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '20%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, var(--color-primary-glow) 0%, transparent 70%)',
          zIndex: -1,
          filter: 'blur(30px)'
        }}></div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #00d2ff 0%, #0066ff 100%)',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 0 16px var(--color-primary-glow)'
          }}>
            <Shield size={24} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>
            {isLogin ? 'Login' : 'Register'}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
            {isLogin ? 'Registered users can login here' : 'Create an administrative operator credential'}
          </p>
        </div>

        {/* Info Box about default seeded accounts */}
        {/* {isLogin && (
          // <div style={{
          //   backgroundColor: 'rgba(0, 210, 255, 0.05)',
          //   border: '1px solid rgba(0, 210, 255, 0.15)',
          //   borderRadius: '8px',
          //   padding: '12px',
          //   marginBottom: '24px',
          //   display: 'flex',
          //   gap: '10px',
          //   fontSize: '0.8rem',
          //   lineHeight: '1.4'
          // }}>
            <Info size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <span style={{ color: '#fff', fontWeight: 600 }}>Demo Credentials (Pre-seeded):</span>
              <div style={{ marginTop: '4px', color: 'var(--color-text-muted)' }}>
                • <strong>Super Admin:</strong> <code style={{ color: 'var(--color-primary)' }}>superadmin@bustrack.com</code> / <code style={{ color: 'var(--color-primary)' }}>superadmin123</code><br/>
                • <strong>Admin:</strong> <code style={{ color: 'var(--color-primary)' }}>admin@bustrack.com</code> / <code style={{ color: 'var(--color-primary)' }}>admin123</code>
              </div>
            </div>
          </div>
        )} */}

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-danger)',
            color: '#ff6b6b',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Operator Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }}>
                  <User size={16} />
                </span>
                <input
                  type="text"
                  placeholder="e.g. John Operator"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ width: '100%', paddingLeft: '40px' }}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }}>
                <Mail size={16} />
              </span>
              <input
                type="email"
                placeholder="operator@transit.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)' }}>
                <Key size={16} />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>Access Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="User">User (Read-only observer)</option>
                <option value="Admin">Admin (Create Routes, Drivers, Buses)</option>
                {/* <option value="SuperAdmin">SuperAdmin (Manage Cities, Logs & Admins)</option> */}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#090a0f',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '10px',
              boxShadow: '0 4px 16px var(--color-primary-glow)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
          >
            {loading ? 'Processing Security...' : isLogin ? 'Login' : 'Register'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Switch mode */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            {isLogin ? "Need a new controller account? Register here" : "Already registered? Sign in here"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
