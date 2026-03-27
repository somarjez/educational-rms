import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiGrid,
  FiCalendar,
  FiBarChart2,
  FiMenu,
  FiX,
  FiChevronDown,
  FiInfo,
  FiLayers,
  FiActivity,
  FiTrendingUp,
  FiAlertTriangle,
  FiTool,
  FiClock,
  FiZap,
  FiAlertCircle,
  FiSettings,
} from 'react-icons/fi';
import './styles/Sidebar.css';

const Sidebar = ({ userRole, onCollapsedChange, fullyHideOnCollapse = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const normalizedRole = userRole?.toUpperCase?.() || '';
  const isAdmin = normalizedRole === 'ADMIN';
  const isFaculty = normalizedRole === 'FACULTY';
  const isAdminLike = isAdmin || isFaculty;
  const isStudent = normalizedRole === 'STUDENT' || !normalizedRole;

  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onCollapsedChange) {
      onCollapsedChange(newCollapsedState);
    }
  };

  const adminMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <FiGrid />,
      path: '/dashboard',
      available: true,
    },
    {
      id: 'scheduling',
      label: 'Scheduling & Resources',
      icon: <FiCalendar />,
      available: isAdminLike,
      path: '/admin-scheduling',
      state: { tab: 'calendar' },
      description: 'Manage scheduling, bookings, and rooms',
    },
    {
      id: 'bookings',
      label: 'Bookings Overview',
      icon: <FiCalendar />,
      available: isAdminLike,
      path: '/bookings',
      description: 'View and manage all resource bookings',
    },
    {
      id: 'capacity-analysis',
      label: 'Capacity Analysis',
      icon: <FiBarChart2 />,
      available: isAdminLike,
      path: '/modeling/resource-utilization',
      description: 'Analyze current room and resource utilization',
    },
    {
      id: 'modeling-simulation',
      label: 'Modeling & Simulation',
      icon: <FiActivity />,
      available: isAdminLike,
      submenu: [
        {
          id: 'modeling',
          label: 'Modeling',
          icon: <FiLayers />,
          description: 'Resource analysis models',
          submenu: [
            {
              id: 'resource-utilization',
              label: 'Resource Utilization',
              icon: <FiBarChart2 />,
              path: '/modeling/resource-utilization',
              description: 'Measure resource usage vs availability',
            },
            {
              id: 'demand-forecasting',
              label: 'Demand Forecasting',
              icon: <FiTrendingUp />,
              path: '/modeling/demand-forecasting',
              description: 'Predict future booking demand',
            },
            {
              id: 'booking-conflict',
              label: 'Booking Conflict Model',
              icon: <FiAlertTriangle />,
              path: '/modeling/booking-conflict',
              description: 'Detect and predict scheduling clashes',
            },
            {
              id: 'equipment-usage',
              label: 'Equipment Usage',
              icon: <FiTool />,
              path: '/modeling/equipment-usage',
              description: 'Analyze equipment wear and demand',
            },
          ],
        },
        {
          id: 'simulation',
          label: 'Simulation',
          icon: <FiSettings />,
          description: 'Simulation scenarios',
          submenu: [
            {
              id: 'room-usage-sim',
              label: 'Room Usage Simulation',
              icon: <FiGrid />,
              path: '/simulation/room-usage',
              description: 'Simulate room booking patterns',
            },
            {
              id: 'equipment-usage-sim',
              label: 'Equipment Usage Simulation',
              icon: <FiTool />,
              path: '/simulation/equipment-usage',
              description: 'Simulate equipment availability',
            },
            {
              id: 'peak-hour-scenario',
              label: 'Peak-Hour Scenarios',
              icon: <FiClock />,
              path: '/simulation/peak-hour',
              description: 'Test high-demand scenarios',
            },
            {
              id: 'shortage-scenario',
              label: 'Shortage Scenarios',
              icon: <FiAlertCircle />,
              path: '/simulation/shortage',
              description: 'Analyze resource shortages',
            },
            {
              id: 'what-if-analysis',
              label: 'What-If Analysis',
              icon: <FiZap />,
              path: '/simulation/what-if',
              description: 'Explore parameter variations',
            },
          ],
        },
      ],
    },
  ];

  const studentMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <FiGrid />,
      path: '/dashboard',
      available: isStudent,
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <FiCalendar />,
      path: '/student/bookings',
      available: isStudent,
    },
    {
      id: 'schedule',
      label: 'Schedule',
      icon: <FiClock />,
      path: '/student/schedule',
      available: isStudent,
    },
    {
      id: 'equipment',
      label: 'Equipment',
      icon: <FiTool />,
      path: '/student/equipment',
      available: isStudent,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <FiAlertCircle />,
      path: '/student/notifications',
      available: isStudent,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <FiSettings />,
      path: '/student/settings',
      available: isStudent,
    },
  ];

  const menuItems = isAdminLike ? adminMenuItems : studentMenuItems;

  const toggleSubmenu = (menuId) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const handleNavigation = (item) => {
    if (item.submenu) {
      toggleSubmenu(item.id);
    } else {
      navigate(item.path, { state: item.state });
    }
  };

  const isActive = (path) => location.pathname === path;
  
  const isSubmenuActive = (submenu) => {
    if (!submenu) return false;
    return submenu.some((item) => {
      if (item.path) return isActive(item.path);
      if (item.submenu) return isSubmenuActive(item.submenu);
      return false;
    });
  };

  // Recursive function to render submenus at any level
  const renderSubmenu = (submenu, level = 0) => {
    if (!submenu) return null;

    const submenuClass = level === 0 ? 'submenu' : 'submenu nested-submenu';

    return (
      <ul className={submenuClass}>
        {submenu.map((subitem) => {
          const hasNestedSubmenu = subitem.submenu && subitem.submenu.length > 0;
          const isExpanded = expandedMenus[subitem.id];
          const isActiveItem = hasNestedSubmenu
            ? isSubmenuActive(subitem.submenu)
            : isActive(subitem.path);

          return (
            <li key={subitem.id} className="submenu-item">
              <button
                className={`submenu-link ${isActiveItem ? 'active' : ''}`}
                onClick={() => {
                  if (hasNestedSubmenu) {
                    toggleSubmenu(subitem.id);
                  } else {
                    navigate(subitem.path, { state: subitem.state });
                  }
                }}
              >
                {subitem.icon && <span className="submenu-icon">{subitem.icon}</span>}
                <div className="submenu-content">
                  <span className="submenu-label">{subitem.label}</span>
                  {subitem.description && (
                    <span className="submenu-desc">{subitem.description}</span>
                  )}
                </div>
                {hasNestedSubmenu && (
                  <span className={`submenu-arrow ${isExpanded ? 'expanded' : ''}`}>
                    <FiChevronDown />
                  </span>
                )}
              </button>
              {/* Recursively render nested submenus */}
              {hasNestedSubmenu && isExpanded && renderSubmenu(subitem.submenu, level + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      {/* Floating toggle button - only shows when fully hidden */}
      {fullyHideOnCollapse && (
        <button
          className={`floating-toggle ${isCollapsed ? 'show' : ''}`}
          onClick={handleToggleCollapse}
          title="Open Menu"
        >
          <FiMenu />
        </button>
      )}

      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${fullyHideOnCollapse && isCollapsed ? 'fully-hidden' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className={`sidebar-brand ${isCollapsed ? 'hidden' : ''}`}>
            <div className="brand-icon">
              <FiLayers />
            </div>
            <span className="brand-text">RMS</span>
          </div>
          <button
            className="toggle-btn"
            onClick={handleToggleCollapse}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <FiMenu /> : <FiX />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {menuItems.map((item) => {
              if (!item.available) return null;

              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isExpanded = expandedMenus[item.id];
              const isActiveMenu = hasSubmenu
                ? isSubmenuActive(item.submenu)
                : isActive(item.path);

              return (
                <li key={item.id} className="nav-item">
                  <button
                    className={`nav-link ${isActiveMenu ? 'active' : ''}`}
                    onClick={() => handleNavigation(item)}
                    title={isCollapsed ? item.label : ''}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className={`nav-label ${isCollapsed ? 'hidden' : ''}`}>
                      {item.label}
                    </span>
                    {hasSubmenu && !isCollapsed && (
                      <span
                        className={`submenu-arrow ${isExpanded ? 'expanded' : ''}`}
                      >
                        <FiChevronDown />
                      </span>
                    )}
                  </button>

                  {/* Render submenu when expanded and not collapsed */}
                  {hasSubmenu && isExpanded && !isCollapsed && renderSubmenu(item.submenu)}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className={`sidebar-footer ${isCollapsed ? 'collapsed-footer' : ''}`}>
          <div className="sidebar-info">
            <div className="info-icon"><FiInfo /></div>
            <p className={`info-text ${isCollapsed ? 'hidden' : ''}`}>
              Manage all scheduling and resource tasks from here
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
