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
        <div>
            <h1>Register</h1>
            <form onSubmit={handelSubmit}>
                <div>
                    <label>Name</label>
                    <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    />
                </div>

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

                {error && <p style={{color: 'red'}}>{error}</p>}

                <button type="submit">Register</button>
            </form>

            <p>
                Already have an account? <Link to = "/login"> Log in </Link>
            </p>
        </div>
    )
}

export default Register;