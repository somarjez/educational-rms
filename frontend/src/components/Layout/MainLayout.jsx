import React, { useState, useCallback } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import './styles/MainLayout.css';

const MainLayout = ({ children, userRole }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = useCallback((collapsed) => {
    setSidebarCollapsed(collapsed);
  }, []);

  return (
    <div className="main-layout">
      <Sidebar userRole={userRole} onCollapsedChange={handleSidebarToggle} />
      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;

