import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Buses from './pages/Buses';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh',
            backgroundColor: 'var(--bg-main)',
          }}>
            {/* Top Navigation Header */}
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            {/* Mobile Sidebar Backdrop Overlay */}
            {sidebarOpen && (
              <div 
                className="sidebar-backdrop" 
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Main Layout Area */}
            <div className="app-layout-wrapper" style={{ 
              display: 'flex', 
              flex: 1, 
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Left Operations Navigation (Except on Login page) */}
              <Routes>
                <Route path="/login" element={null} />
                <Route path="*" element={<Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />} />
              </Routes>

              {/* Main Content Area */}
              <main className="app-layout-main" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/buses" element={<Buses />} />
                  <Route path="/login" element={<Login />} />
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute requireAdmin={true}>
                        <AdminPanel />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
