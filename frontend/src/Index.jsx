import {useAuth} from './AuthContext.jsx';
import {useNavigate, Link} from 'react-router-dom';

function Index(){

    const {user, logout} = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    return(
        <div>
            <h1>Dashboard</h1>
            {user? (
                <>
                <p>Welcome, {user.name}!</p>
                <p>Email: {user.email}</p>
                <p>Role: {user.role?.name ?? 'No role assigned'}</p>
                <p><Link to="/tickets">View Tickets</Link></p>
                <button onClick={handleLogout}>Log Out</button>                
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    )
}

export default Index;