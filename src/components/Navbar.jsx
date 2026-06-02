import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Navigation, LogOut, LogIn, User, Wifi, WifiOff, Shield, Menu } from 'lucide-react';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout, isAdmin } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="glass-panel app-header" style={{
      margin: '16px 20px',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: '16px',
      zIndex: 1000,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Menu Toggle Button for mobile */}
        {user && (
          <button className="hamburger-btn" onClick={toggleSidebar}>
            <Menu size={20} />
          </button>
        )}

        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 12px var(--color-primary-glow)'
        }}>
          <Navigation size={18} color="#fff" />
        </div>
        <div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.05em', color: '#fff' }}>OMNI</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 300, color: 'var(--color-primary)' }}>PATH</span>
        </div>
      </Link>
      </div>

      {/* Navigation Stats & Sockets */}
      <div className="navbar-stats-container" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* WebSocket Connectivity Badge */}
        {/* <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '0.8rem'
        }}>
          {connected ? (
            <>
              <Wifi size={14} color="var(--color-success)" />
              <span style={{ color: 'var(--color-text-main)' }}>LIVE FEED</span>
              <span className="status-dot active" style={{ marginLeft: '4px' }}></span>
            </>
          ) : (
            <>
              <WifiOff size={14} color="var(--color-danger)" />
              <span style={{ color: 'var(--color-danger)' }}>DISCONNECTED</span>
              <span className="status-dot" style={{ backgroundColor: 'var(--color-danger)', boxShadow: '0 0 8px var(--color-danger)' }}></span>
            </>
          )}
        </div> */}

        {/* User Session Area */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
            }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#fff' }}>{user.username}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isAdmin && <Shield size={10} color="var(--color-primary)" />}
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: user.role === 'SuperAdmin' ? 'var(--color-warning)' : user.role === 'Admin' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }}>
                  {user.role.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}>
              <User size={16} />
            </div>

            <button 
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '8px',
              }}
              title="Logout"
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <Link to="/login" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--color-primary)',
            color: '#090a0f',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 4px 12px var(--color-primary-glow)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
          >
            <LogIn size={14} />
            Admin Login
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
