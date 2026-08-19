import {useState} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import api from './api.js';
import {useAuth} from './AuthContext.jsx';

function Login(){
    //useState for email/password/error — tracks what the user types, and holds any error message to display
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const {login} = useAuth();
    const navigate = useNavigate();

    //handleSubmit — called when the user clicks the "Log In" button; sends a POST request to /api/login with the email/password, and if successful, stores the token/user in shared state and navigates to the home page
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try{
            const response = await api.post('/login', {email, password});
            const token = response.data.token;

            //Fetch user info from the backend using the token
            const meResponse = await api.get('/me', { headers: {Authorization: `Bearer ${token}`}
            });

            login(token, meResponse.data);
            navigate('/');
        }
        catch(err){
            setError('Invalid email or password');
        }
    }

    return(
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-logo">🛠️ IT Help Desk</div>
                <h1 style={{ fontSize: '1.3rem', marginBottom: '1.25rem' }}>Log In</h1>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            className="form-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="error-text">{error}</p>}
                    <button className="btn btn-primary" style={{ width: '100%' }} type="submit">Log In</button>
                </form>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    )
    
}

export default Login;