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

        <div>

            <h1>
                Login
            </h1>

            <form onSubmit={handleSubmit}>

                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && <p style={{color: 'red'}}>{error} </p>}
                <button type="submit">Log In</button>

            </form>
               <p>
                Don't have an account? <Link to="/register">Register</Link>
               </p> 
        </div>
    )
    
}

export default Login;