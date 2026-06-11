import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  LogOut,
  Fuel,
  User as UserIcon,
  FileText,
  ClipboardList,
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, isOpen }) => {
  const { user, logout } = useAuth();

  const mainItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['MANAGER', 'OWNER'] },
  ];

  const operationsItems = [
    { id: 'entry', name: 'Daily Closing', icon: ClipboardList, roles: ['MANAGER', 'OWNER'] },
    { id: 'history', name: 'Closing History', icon: History, roles: ['MANAGER', 'OWNER'] },
    { id: 'reports', name: 'Reports', icon: FileText, roles: ['MANAGER', 'OWNER'], mapTo: 'history' },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`app-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div style={brandContainerStyle}>
        <div style={brandRowStyle}>
          <Fuel size={24} color="#10b981" />
          <span style={brandNameStyle}>HP Fuel Station</span>
        </div>
        <span style={brandSubtitleStyle}>OPERATIONAL HUB</span>
      </div>

      {/* User Info Card */}
      <div style={userCardStyle}>
        <div style={avatarStyle}>
          <span style={avatarTextStyle}>{getInitials(user?.fullName)}</span>
        </div>
        <div style={userDetailsStyle}>
          <div style={userNameStyle}>{user?.fullName || 'User'}</div>
          <span style={userRoleBadgeStyle(user?.role)}>{user?.role}</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={navStyle}>
        <div style={sectionTitleStyle}>MAIN</div>
        {mainItems
          .filter((item) => item.roles.includes(user?.role))
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={navItemStyle(isActive)}
                className="nav-btn"
              >
                {isActive && <span style={activeIndicatorStyle} />}
                <Icon size={18} color={isActive ? '#10b981' : '#6b7280'} />
                <span>{item.name}</span>
              </button>
            );
          })}

        <div style={dividerStyle} />

        <div style={sectionTitleStyle}>OPERATIONS</div>
        {operationsItems
          .filter((item) => item.roles.includes(user?.role))
          .map((item) => {
            const Icon = item.icon;
            const targetTab = item.mapTo || item.id;
            const isActive =
              activeTab === item.id ||
              (item.id === 'history' && activeTab === 'report-details') ||
              (item.id === 'reports' && activeTab === 'report-details');
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(targetTab)}
                style={navItemStyle(isActive)}
                className="nav-btn"
              >
                {isActive && <span style={activeIndicatorStyle} />}
                <Icon size={18} color={isActive ? '#10b981' : '#6b7280'} />
                <span>{item.name}</span>
              </button>
            );
          })}

        {/* Quick Entry Button */}
        <button
          onClick={() => setActiveTab('entry')}
          style={quickEntryStyle}
          className="nav-btn"
        >
          <PlusCircle size={18} />
          <span>Quick Entry</span>
        </button>
      </nav>

      {/* Logout Footer */}
      <div style={footerStyle}>
        <button onClick={logout} style={logoutButtonStyle} className="nav-btn">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

/* ---- Inline Styles ---- */

const brandContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem',
  paddingLeft: '0.65rem',
  marginBottom: '1.75rem',
};

const brandRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.65rem',
};

const brandNameStyle = {
  fontSize: '1.15rem',
  fontWeight: '800',
  color: '#10b981',
  letterSpacing: '-0.02em',
};

const brandSubtitleStyle = {
  fontSize: '0.65rem',
  fontWeight: '700',
  color: '#6b7280',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  paddingLeft: '2.45rem',
};

const userCardStyle = {
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
  gap: '0.75rem',
  padding: '0.85rem',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: '12px',
  marginBottom: '1.5rem',
};

const avatarStyle = {
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #10b981, #059669)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const avatarTextStyle = {
  color: 'white',
  fontWeight: '700',
  fontSize: '1rem',
  letterSpacing: '0.02em',
};

const userDetailsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem',
  overflow: 'hidden',
  minWidth: 0,
  flex: 1,
};

const userNameStyle = {
  fontSize: '0.88rem',
  fontWeight: '600',
  color: '#f3f4f6',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const userRoleBadgeStyle = (role) => ({
  alignSelf: 'flex-start',
  fontSize: '0.62rem',
  fontWeight: '700',
  padding: '0.1rem 0.45rem',
  borderRadius: '4px',
  background: role === 'OWNER' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)',
  color: role === 'OWNER' ? '#34d399' : '#818cf8',
  border: role === 'OWNER' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(99, 102, 241, 0.2)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
});

const navStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
  flexGrow: 1,
};

const navItemStyle = (isActive) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  padding: '0.75rem 0.85rem 0.75rem 1.1rem',
  width: '100%',
  background: isActive ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
  border: 'none',
  borderRadius: '10px',
  color: isActive ? '#34d399' : '#9ca3af',
  fontSize: '0.88rem',
  fontWeight: isActive ? '600' : '500',
  cursor: 'pointer',
  textAlign: 'left',
  outline: 'none',
  transition: 'all 0.2s ease',
});

const activeIndicatorStyle = {
  position: 'absolute',
  left: 0,
  top: '20%',
  bottom: '20%',
  width: '3px',
  borderRadius: '0 3px 3px 0',
  background: '#00E676',
};

const dividerStyle = {
  height: '1px',
  background: 'rgba(255, 255, 255, 0.05)',
  margin: '0.85rem 0',
};

const sectionTitleStyle = {
  fontSize: '0.68rem',
  fontWeight: '700',
  letterSpacing: '0.16em',
  paddingLeft: '0.85rem',
  color: '#6b7280',
  textTransform: 'uppercase',
  margin: '0.65rem 0 0.5rem',
};

const quickEntryStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.6rem',
  padding: '0.75rem 1rem',
  width: '100%',
  background: '#00E676',
  border: 'none',
  borderRadius: '8px',
  color: '#060B16',
  fontSize: '0.9rem',
  fontWeight: '700',
  cursor: 'pointer',
  outline: 'none',
  marginTop: '1rem',
  transition: 'all 0.25s ease',
  boxShadow: '0 4px 16px -4px rgba(0, 230, 118, 0.4)',
};

const footerStyle = {
  marginTop: 'auto',
  paddingTop: '0.75rem',
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
};

const logoutButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem 0.85rem',
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderRadius: '10px',
  color: '#f87171',
  fontSize: '0.88rem',
  fontWeight: '600',
  cursor: 'pointer',
  textAlign: 'left',
  outline: 'none',
  transition: 'all 0.2s ease',
};

export default Sidebar;
