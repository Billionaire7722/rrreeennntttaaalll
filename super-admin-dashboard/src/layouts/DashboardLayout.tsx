import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { io } from 'socket.io-client';
import { resolvedApiBaseUrl } from '../api/axios';
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    Target,
    LogOut,
    Activity,
    History,
    Radar,
    Table2,
    Home,
    Trash2,
    Search,
    Bell,
    UserMinus,
    UserX,
    FileText,
    MessageSquare,
    AlertTriangle,
    ShieldAlert,
    TrendingUp
} from 'lucide-react';
import css from './DashboardLayout.module.css';

export const DashboardLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [notifications, setNotifications] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        if (!resolvedApiBaseUrl) {
            console.warn('No API base URL configured; skipping notification socket connection.');
            return;
        }

        let socket: ReturnType<typeof io> | undefined;
        try {
            socket = io(resolvedApiBaseUrl, {
                auth: { token }
            });
        } catch (err) {
            console.error('Failed to initialize socket.io:', err);
            return;
        }

        socket.on('connect', () => {
            console.log('Admin connected to notifications gateway');
        });

        socket.on('new_report', () => {
            setNotifications(prev => prev + 1);
            // Optional: alert or Toast
        });

        socket.on('new_support_ticket', () => {
            setNotifications(prev => prev + 1);
        });

        return () => {
            socket?.disconnect();
        };
    }, []);

    const menuGroups = [
        {
            title: 'General',
            links: [
                { to: '/', label: 'Overview', icon: <LayoutDashboard size={18} /> },
            ]
        },
        {
            title: 'Users',
            links: [
                { to: '/users', label: 'All Users', icon: <Users size={18} /> },
                { to: '/users?status=restricted', label: 'Restricted', icon: <UserMinus size={18} /> },
                { to: '/users?status=deleted', label: 'Deleted', icon: <UserX size={18} /> },
            ]
        },
        {
            title: 'Properties',
            links: [
                { to: '/houses', label: 'All Properties', icon: <Home size={18} /> },
                { to: '/houses?status=deleted', label: 'Deleted', icon: <Trash2 size={18} /> },
                { to: '/houses-sheet', label: 'Houses Sheet', icon: <Table2 size={18} /> },
            ]
        },
        {
            title: 'Reports & Support',
            links: [
                { to: '/reports/users', label: 'User Reports', icon: <AlertTriangle size={18} /> },
                { to: '/reports/properties', label: 'Property Reports', icon: <FileText size={18} /> },
                { to: '/reports/support', label: 'Support Requests', icon: <MessageSquare size={18} /> },
            ]
        },
        {
            title: 'System Monitoring',
            links: [
                { to: '/login-logs', label: 'Login Logs', icon: <History size={18} /> },
                { to: '/fraud-alerts', label: 'User Fraud', icon: <ShieldAlert size={18} color="var(--danger-color)" /> },
                { to: '/property-fraud', label: 'Property Fraud', icon: <Home size={18} color="var(--danger-color)" /> },
                { to: '/suspicious-ips', label: 'Suspicious IPs', icon: <Radar size={18} /> },
                { to: '/audit-logs', label: 'Audit Logs', icon: <Target size={18} /> },
                { to: '/live-monitor', label: 'Live Monitor', icon: <Activity size={18} /> },
            ]
        },
        {
            title: 'Analytics',
            links: [
                { to: '/metrics', label: 'System Metrics', icon: <Activity size={18} /> },
                { to: '/growth', label: 'Growth Charts', icon: <TrendingUp size={18} /> },
            ]
        }
    ];

    // Helper for reactive titles
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Overview';
        if (path.includes('users')) return 'User Management';
        if (path.includes('houses')) return 'Properties Management';
        if (path.includes('metrics')) return 'System Metrics';
        if (path.includes('reports/users')) return 'User Reports';
        if (path.includes('reports/properties')) return 'Property Reports';
        if (path.includes('reports/support')) return 'Support Requests';
        if (path.includes('audit-logs')) return 'Audit Logs';
        if (path.includes('login-logs')) return 'Login Logs';
        if (path.includes('live-monitor')) return 'Live Monitor';
        return 'Dashboard';
    };

    return (
        <div className={css.layout}>
            <aside className={css.sidebar}>
                <div className={css.brand}>
                    <ShieldCheck className={css.brandIcon} size={24} />
                    <h2>SuperAdmin</h2>
                </div>

                <nav className={css.nav}>
                    {menuGroups.map((group, gIdx) => (
                        <div key={gIdx} className={css.navGroup}>
                            <h3 className={css.navGroupTitle}>{group.title}</h3>
                            {group.links.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    className={({ isActive }) => `${css.navItem} ${isActive ? css.active : ''}`}
                                >
                                    {link.icon}
                                    <span>{link.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className={css.profile}>
                    <div className={css.userInfo}>
                        <span className={css.userName}>{user?.name || 'Super Admin'}</span>
                        <span className={css.userRole}>{user?.role || 'Administrator'}</span>
                    </div>
                    <button onClick={logout} className={css.logoutBtn} title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            <main className={css.mainContent}>
                <header className={css.headerArea}>
                    <h1 className={css.pageTitle}>{getPageTitle()}</h1>
                    <div className={css.headerActions}>
                        <button className={css.logoutBtn} title="Search">
                            <Search size={18} />
                        </button>
                        <button className={css.logoutBtn} title="Notifications" onClick={() => setNotifications(0)} style={{ position: 'relative' }}>
                            <Bell size={18} />
                            {notifications > 0 && (
                                <span className={css.notificationBadge}>{notifications}</span>
                            )}
                        </button>
                    </div>
                </header>
                <div className={css.contentWrapper}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

