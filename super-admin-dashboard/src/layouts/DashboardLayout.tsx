import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import {
    BarChart3,
    Users,
    ShieldCheck,
    Target,
    LogOut,
    Activity,
    History,
    Radar
} from 'lucide-react';
import css from './DashboardLayout.module.css';

export const DashboardLayout: React.FC = () => {
    const { user, logout } = useAuth();

    const links = [
        { to: '/', label: 'Overview', icon: <BarChart3 size={20} /> },
        { to: '/users', label: 'User Management', icon: <Users size={20} /> },
        { to: '/admins', label: 'Admin Management', icon: <ShieldCheck size={20} /> },
        { to: '/metrics', label: 'System Metrics', icon: <Activity size={20} /> },
        { to: '/live-monitor', label: 'Live Monitor', icon: <Radar size={20} /> },
        { to: '/audit-logs', label: 'Audit Logs', icon: <Target size={20} /> },
        { to: '/login-logs', label: 'Login Logs', icon: <History size={20} /> },
    ];

    return (
        <div className={css.layout}>
            <aside className={`glass-panel ${css.sidebar}`}>
                <div className={css.brand}>
                    <ShieldCheck className={css.brandIcon} size={28} />
                    <h2>SuperAdmin</h2>
                </div>

                <nav className={css.nav}>
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) => `${css.navItem} ${isActive ? css.active : ''}`}
                        >
                            {link.icon}
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className={css.profile}>
                    <div className={css.userInfo}>
                        <span className={css.userName}>{user?.name || 'Super Admin'}</span>
                        <span className={css.userRole}>{user?.role}</span>
                    </div>
                    <button onClick={logout} className={css.logoutBtn} title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </aside>

            <main className={css.mainContent}>
                <div className={css.headerArea}>
                    <h1 className={css.pageTitle}>Dashboard</h1>
                </div>
                <div className={css.contentWrapper}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
