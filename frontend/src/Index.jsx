import {useAuth} from './AuthContext.jsx';
import {useNavigate} from 'react-router-dom';

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
                <p>Role ID: {user.role_id ?? 'No role assigned'}</p>
                <button onClick={handleLogout}>Log Out</button>                
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    )
}

export default Index;