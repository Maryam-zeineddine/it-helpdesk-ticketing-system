import {useState, useEffect} from 'react';
import api from './api';
import {useAuth} from './AuthContext';

function TicketComments({ticketId}) {
    const {token, user} = useAuth();
    const role = user?.role?.name;
    // Only Agents are allowed to mark a comment as internal — matches the backend rule exactly
    const isAgent = role === 'Agent' || role === 'IT Support Agent';

    const authHeader = {headers: {Authorization: `Bearer ${token}`}};

    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [body, setBody] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [posting, setPosting] = useState(false);

    // Fetches the current comment list for this ticket from the backend.
    // The backend already filters out internal comments for Employees, so
    // this component just displays whatever it receives, with no extra filtering.
    
    const loadComments = () => {
        setLoading(true);
        api.get(`/tickets/${ticketId}/comments`, authHeader)
            .then(response => setComments(response.data))
            .catch(err => setError('Failed to load comments'))
            .finally(() => setLoading(false));
    };
    
    // Runs loadComments() once when the component first mounts, and again
    // if the ticket ID or auth token ever changes (e.g. navigating between tickets).
    useEffect(() => {
        loadComments();
    }, [ticketId, token]);

    // Posts a new comment to the backend, then re-fetches the full comment
    // list so the UI always reflects exactly what's in the database.
    const handleSubmit = async() => {
        if (!body.trim()) return; // Don't allow empty comments

        setPosting(true);
        setError('');
        try{
            await api.post(`/tickets/${ticketId}/comments`, 
                {body, is_internal: isInternal}, authHeader);

            //Clear the input fields and reload comments after successful submission
            setBody('');
            setIsInternal(false);
            loadComments();
        } catch (err) {
            const data = err.response?.data;
            setError(data?.error?? 'Failed to post comment');
        } finally {
            setPosting(false);
        }
    };

    return(
        <div>
            <h3>Comments</h3>
            
            {loading && <p>Loading comments...</p>}
            {error && <p style={{color: 'red'}}>{error}</p>}

            {!loading && comments.length === 0 && <p>No comments yet.</p>}

            {/* Renders each comment: author, timestamp, text, and an "Internal" badge if applicable */}
            <ul style={{listStyleType: 'none', padding: 0}}>
                {comments.map(comment => (
                    <li key={comment.id} style={{marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #ddd'}}>
                        <div>
                        <strong>{comment.user?.name}</strong>
                        {' '}
                        <span style = {{color: '#666', fontSize: '0.85em'}}>
                            {new Date(comment.created_at).toLocaleString()}
                        </span>
                        {comment.is_internal && (
                            <span style={{marginLeft: '0.5rem', color: '#fff', backgroundColor: '#a33', padding: ' 0 6px', borderRadius: '4px', fontSize: '0.75em'}}>
                                Internal
                            </span>
                        )}
                        </div>
                        <p style={{margin: '0.25rem 0 0 0'}}>{comment.body}</p>
                    </li>
                ))}
            </ul>
            {/*New comment form: textarea for body, checkbox for internal, and submit button*/}
            <div>
                <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows = {3}
                    placeholder="Write a comment..."
                    style = {{ width:'100%'}}
                />

                {/*Chackbox only rendered for Agents; matches the backend rule that only 
                Agents can mark comments as internal*/}
                {isAgent && (
                    <div>
                        <label>
                            <input 
                                type="checkbox"
                                checked={isInternal}
                                onChange={e => setIsInternal(e.target.checked)}
                            />
                            {' '}Mark as internal note (hidden from employees)
                        </label>
                    </div>
                )}
                <button disabled={posting || !body.trim()} onClick={handleSubmit}>
                    {posting ? 'Posting...' : 'Post Comment'}
                </button>
            </div>
        </div>
    );
}

export default TicketComments;
    