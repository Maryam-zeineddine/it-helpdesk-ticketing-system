import {useAuth} from './AuthContext.jsx';
import {useNavigate, Link} from 'react-router-dom';
import { useState, useEffect} from 'react';
import api from './api.js';

function Index(){

    const {user, token, logout} = useAuth();
    const navigate = useNavigate();

    const [summary, setSummary] = useState(null);
    const [loading, setloading] = useState(true);
    const [error, setError] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    //Fetch the role-scoped ticket summary as soon as we have a token 
    useEffect(() => {
        if(!token) return;

        api.get('/dashboard/summary', {headers: {Authorization: `Bearer ${token}`}})
            .then((response) => setSummary(response.data))
            .catch(() => setError('Failed to load dashboard summary'))
            .finally(() => setloading(false));
    }, [token]);

    return(
        <div>
            <h1>Dashboard</h1>
            {user? (
                <>
                <p>Welcome, {user.name}!</p>
                <p>Email: {user.email}</p>
                <p>Role: {user.role?.name ?? 'No role assigned'}</p>
                <p><Link to="/tickets">View Tickets</Link></p>

                {loading && <p>Loading summary...</p>}
                {error && <p style={{color: 'red'}}>{error}</p>}

                {summary && (
                    <div style={{marginTop: '1.5rem'}}>
                        <h2>Ticket Summary (last 2 months)</h2>

                        {/*KPI card: total*/}
                        <div style={{
                            display: 'inline-block',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            padding: '1rem',
                            marginRight: '1rem',
                            minWidth: '120px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold'}}>{summary.total}</div>
                            <div>Total</div>
                        </div>

                        {/*KPI card per status*/}
                        {Object.entries(summary.by_status).map(([statusName,count]) => (
                            <div  key={statusName} style={{
                                display: 'inline-block',
                                border: '1px solid #ccc',
                                borderRadius: '8px',
                                padding: '1rem',
                                marginRight: '1rem',
                                minWidth: '120px',
                                textAlign: 'center'
                            }}>
                                <div style={{fontSize: '1.8rem', fontWeight: 'bold'}}>{count}</div>
                                <div>{statusName}</div>
                            </div>
                        ))}

                        {summary.unassigned_tickets && summary.unassigned_tickets.length > 0 && (
                            <div style={{marginTop: '1.5rem'}}>
                                <h2>New Tickets Available to Take</h2>
                                <ul>
                                    {summary.unassigned_tickets.map((ticket) => (
                                        <li key={ticket.id} style={{marginBottom: '0.5rem'}}>
                                            <Link to={`/tickets/${ticket.id}`}>{ticket.title}</Link>
                                            {' - '}{ticket.category?.name ?? 'Uncategorized'}
                                            {' - '}{new Date(ticket.created_at).toLocaleDateString()}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {summary.unassigned_tickets && summary.unassigned_tickets.length === 0 && (
                            <p style={{ marginTop: '1.5rem', color: '#666'}}>No new unassigned tickets right now </p>
                        )}
                    </div>
                )}

                <p style={{marginTop: '1.5rem'}}>
                    <button onClick={handleLogout}>Log Out</button>
                </p>
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    )
}

export default Index;