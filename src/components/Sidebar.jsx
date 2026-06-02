import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Map, Bus, Shield, Lock, X } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, isAdmin } = useAuth();

  const navItems = [
    {
      path: '/',
      name: 'Map Dashboard',
      icon: <Map size={18} />,
      restricted: false,
    },
    {
      path: '/buses',
      name: 'Transit Fleet',
      icon: <Bus size={18} />,
      restricted: false,
    },
    {
      path: '/admin',
      name: 'Control Panel',
      icon: <Shield size={18} />,
      restricted: true,
      adminOnly: true,
    },
  ];

  return (
    <nav className={`glass-panel sidebar-drawer ${isOpen ? 'open' : ''}`} style={{
      width: '240px',
      margin: '0 0 16px 20px',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      height: 'calc(100vh - 120px)',
      position: 'sticky',
      top: '96px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        paddingLeft: '12px',
      }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--color-text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          Transit Operations
        </div>
        <button 
          className="hamburger-btn" 
          onClick={() => setIsOpen(false)}
          style={{ padding: '4px', margin: 0, minHeight: 'auto', width: 'auto' }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {navItems.map((item) => {
          const isLocked = item.restricted && !isAdmin;

          return (
            <NavLink
              key={item.path}
              to={isLocked ? '#' : item.path}
              onClick={() => {
                if (!isLocked) setIsOpen(false);
              }}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '8px',
                color: isLocked ? 'var(--color-text-dim)' : isActive ? '#fff' : 'var(--color-text-muted)',
                backgroundColor: isActive && !isLocked ? 'rgba(0, 210, 255, 0.1)' : 'transparent',
                border: '1px solid',
                borderColor: isActive && !isLocked ? 'rgba(0, 210, 255, 0.2)' : 'transparent',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                cursor: isLocked ? 'not-allowed' : 'pointer',
              })}
              onMouseEnter={(e) => {
                if (!isLocked && !e.currentTarget.style.backgroundColor) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLocked && e.currentTarget.style.backgroundColor === 'rgba(255, 255, 255, 0.03)') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </div>
              
              {isLocked && (
                <Lock size={12} color="var(--color-text-dim)" />
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info inside Sidebar */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid var(--border-color)',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '0.75rem',
        color: 'var(--color-text-muted)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {/* <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Telemetry rate:</span>
          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>0.5 Hz</span>
        </div> */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Role level:</span>
          <span style={{ fontWeight: 600, color: user ? 'var(--color-primary)' : 'var(--color-text-dim)' }}>
            {user ? user.role : 'Guest'}
          </span>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
