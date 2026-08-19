import {NavLink, useNavigate} from 'react-router-dom';
import {useAuth} from './AuthContext.jsx';
import NotificationBell from './NotificationBell.jsx';

function Layout({children}){
    const {user, logout} = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const canCreate = user?.role?.name === 'Employee' || user?.role?.name === 'Admin';
    const isAdmin = user?.role?.name === 'Admin';

    return(
        <div className="app-shell">
            <aside className="sidebar">
                <div className="sidebar-logo">🛠️ IT Help Desk</div>
                <nav className="sidebar-nav">
                    <navLink to="/" end className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        Tickets
                    </navLink>
                    {canCreate && (
                        <NavLink to="/tickets/new" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            + New Ticket
                        </NavLink>
                    )}
                    {isAdmin && (
                        <NavLink to="/reports" className={({isActive}) => `sidebar-link${isActive ? 'active' : ''}`}>
                            Reports
                        </NavLink>
                    )}
                </nav>
            </aside>

            <div className="main-area">
                <header className="topbar">
                    <NotificationBell />
                    <span className="topbar-user">{user?.name} . {user?.role?.name}</span>
                    <button className="btn btn-secondary" onClick={handleLogout}>Log Out</button>
                </header>

                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default Layout;