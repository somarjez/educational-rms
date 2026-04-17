import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiGrid,
  FiBriefcase,
  FiMenu,
  FiX,
  FiChevronDown,
  FiInfo,
  FiTrendingUp,
  FiZap,
  FiAlertCircle,
  FiSettings,
  FiUsers,
} from 'react-icons/fi';
import api from '../../services/api';
import {
  DashboardBellIcon,
  DashboardCalendarIcon,
  DashboardCalendarCheckIcon,
  DashboardChartBarIcon,
  DashboardClockIcon,
  DashboardStackIcon,
  DashboardUserIcon,
  DashboardWarningIcon,
  DashboardWrenchIcon,
  DashboardWrenchScrewdriverIcon,
} from '../../features/dashboard/icons/DashboardIcons';
import sidebarBooksLogo from '../../assets/images/sidebar-books-logo.svg';
import './styles/Sidebar.css';

const Sidebar = ({ userRole, onCollapsedChange, fullyHideOnCollapse = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch unread notifications count
  useEffect(() => {
    fetchUnreadCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/scheduling/notifications/unread_count/');
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const normalizedRole = String(userRole || '').toUpperCase();
  const isAdminUser = normalizedRole === 'ADMIN';
  const isFacultyUser = normalizedRole === 'FACULTY';
  const isAdmin = isAdminUser || isFacultyUser;
  const isStudent = !isAdmin;

  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onCollapsedChange) {
      onCollapsedChange(newCollapsedState);
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <FiGrid />,
      path: '/dashboard',
      available: true,
    },
    {
      id: 'faculty-notifications',
      label: 'Notifications',
      icon: <DashboardBellIcon />,
      path: '/notifications',
      available: isFacultyUser,
      description: 'View your notifications',
      badge: unreadCount > 0 ? unreadCount : null,
    },
    // Student Navigation Items (visible only to students)
    {
      id: 'student-bookings',
      label: 'Bookings',
      icon: <DashboardCalendarIcon />,
      path: '/student/bookings',
      available: isStudent,
      description: 'View your resource bookings',
    },
    {
      id: 'student-schedule',
      label: 'Schedule',
      icon: <DashboardClockIcon />,
      path: '/schedule',
      available: isStudent,
      description: 'View your upcoming schedule',
    },
    {
      id: 'student-equipment',
      label: 'Equipment',
      icon: <DashboardWrenchIcon />,
      path: '/equipment',
      available: isStudent,
      description: 'Browse available resources',
    },
    {
      id: 'student-equipment-request',
      label: 'Request Equipment',
      icon: <DashboardWrenchScrewdriverIcon />,
      path: '/equipment/request',
      available: isStudent,
      description: 'Submit equipment requests',
    },
    {
      id: 'student-notifications',
      label: 'Notifications',
      icon: <DashboardBellIcon />,
      path: '/notifications',
      available: isStudent,
      description: 'View your notifications',
    },
    {
      id: 'student-settings',
      label: 'Settings',
      icon: <FiSettings />,
      path: '/settings',
      available: isStudent,
      description: 'Manage account and app settings',
    },
    {
      id: 'student-profile',
      label: 'Profile',
      icon: <DashboardUserIcon />,
      path: '/profile',
      available: isStudent,
      description: 'Manage your profile settings',
    },
    // Admin Navigation Items (visible only to admin/faculty)
    {
      id: 'scheduling',
      label: 'Scheduling & Resources',
      icon: <DashboardCalendarCheckIcon />,
      available: isAdmin,
      path: '/admin-scheduling',
      state: { tab: 'calendar' },
      description: 'Manage scheduling, bookings, and rooms',
    },
    {
      id: 'bookings',
      label: 'Bookings Overview',
      icon: <DashboardCalendarIcon />,
      available: isAdmin,
      path: '/bookings',
      description: 'View and manage all resource bookings',
    },
    {
      id: 'admin-equipment-request',
      label: 'Request Equipment',
      icon: <DashboardWrenchScrewdriverIcon />,
      available: isAdmin,
      path: '/equipment/request',
      description: 'Submit equipment requests',
    },
    {
      id: 'admin-equipment-requests',
      label: 'Equipment Requests',
      icon: <DashboardCalendarIcon />,
      available: isAdminUser,
      path: '/admin/equipment-requests',
      description: 'Approve or reject equipment requests',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <DashboardChartBarIcon />,
      available: isAdmin,
      path: '/dashboard/reports',
      description: 'View room, equipment, and activity insights',
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: <FiUsers />,
      available: isAdminUser,
      path: '/admin/users',
      description: 'View users and send password reset emails',
    },
    {
      id: 'modeling-simulation',
      label: 'Modeling & Simulation',
      icon: <FiBriefcase />,
      available: isAdmin,
      submenu: [
        {
          id: 'modeling',
          label: 'Modeling',
          icon: <DashboardStackIcon />,
          description: 'Resource analysis models',
          submenu: [
            {
              id: 'resource-utilization',
              label: 'Resource Utilization',
              icon: <DashboardChartBarIcon />,
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
              icon: <DashboardWarningIcon />,
              path: '/modeling/booking-conflict',
              description: 'Detect and predict scheduling clashes',
            },
            {
              id: 'equipment-usage',
              label: 'Equipment Usage',
              icon: <DashboardWrenchIcon />,
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
              icon: <DashboardWrenchIcon />,
              path: '/simulation/equipment-usage',
              description: 'Simulate equipment availability',
            },
            {
              id: 'peak-hour-scenario',
              label: 'Peak-Hour Scenarios',
              icon: <DashboardClockIcon />,
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
              <img src={sidebarBooksLogo} alt="RMS" className="brand-logo-image" />
            </div>
            <div className="brand-copy">
              <span className="brand-text">RMS</span>
              <span className="brand-subtext">Educational Resource Management</span>
              <span className="brand-description">Your comprehensive resource management platform.</span>
            </div>
          </div>
          <button
            className="toggle-btn"
            onClick={handleToggleCollapse}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <FiMenu /> : <FiX />}
          </button>
        </div>

        <div className="sidebar-divider" aria-hidden="true" />

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
                    {item.badge && item.badge > 0 && (
                      <span className="nav-badge">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
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
