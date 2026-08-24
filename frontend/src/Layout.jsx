import {NavLink, useNavigate, useLocation} from 'react-router-dom';
import {useAuth} from './AuthContext.jsx';
import NotificationBell from './NotificationBell.jsx';

// Maps a route path to a short readable label for the breadcrumb.
function getPageLabel(pathname) {
    if (pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/tickets/new')) return 'New Ticket';
    if (pathname.startsWith('/tickets')) return 'Tickets';
    if (pathname.startsWith('/reports')) return 'Reports';
    if (pathname.startsWith('/users')) return 'Manage Users';
    return '';
}

function Layout({children}){
    const {user, logout} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const canCreate = user?.role?.name === 'Employee' || user?.role?.name === 'Admin';
    const isAdmin = user?.role?.name === 'Admin';
    const pageLabel = getPageLabel(location.pathname);

    return(
        <div className="app-shell">
            <aside className="sidebar">
                <div className="sidebar-logo">🛠️ IT Help Desk</div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Workspace</div>
                    <NavLink to="/" end className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        Dashboard
                    </NavLink>
                    <NavLink to="/tickets" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        Tickets
                    </NavLink>
                    {canCreate && (
                        <NavLink to="/tickets/new" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            + New Ticket
                        </NavLink>
                    )}

                    {isAdmin && (
                        <>
                            <div className="sidebar-section-label">Administration</div>
                            <NavLink to="/reports" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                Reports
                            </NavLink>
                            <NavLink to="/users" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                Manage Users
                            </NavLink>
                        </>
                    )}
                </nav>
            </aside>

            <div className="main-area">
                <header className="topbar">
                    <NotificationBell />
                    <span className="topbar-user">{user?.name} · {user?.role?.name}</span>
                    <button className="btn btn-secondary" onClick={handleLogout}>Log Out</button>
                </header>

                <main className="page-content">
                    {pageLabel && (
                        <div className="breadcrumb">IT Help Desk › {pageLabel}</div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}

export default Layout;