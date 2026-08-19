import {useState} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import api from './api.js';
import {useAuth} from './AuthContext.jsx';

function Register(){
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]= useState('');
    const {login} = useAuth();
    const navigate  = useNavigate();
    
    const handelSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try{
            const response = await api.post('/register', {name, email, password});
            const token = response.data.token;
            const user = response.data.user;

            login(token, user);
            navigate('/');
        }

        catch(err) {
            if (err.response?.data?.email){
                setError(err.response.data.email[0]);
            }
            else{
                setError('Registration failed. Please try again.');
            }
        }
    }

    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-logo">🛠️ IT Help Desk</div>
                <h1 style={{ fontSize: '1.3rem', marginBottom: '1.25rem' }}>Register</h1>

                <form onSubmit={handelSubmit}>
                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                            className="form-input"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

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

                    <button className="btn btn-primary" style={{ width: '100%' }} type="submit">Register</button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </div>
        </div>
    )
}

export default Register;