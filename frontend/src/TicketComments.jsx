import {useState, useEffect, useRef} from 'react';
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
    const [imageFile, setImageFile] = useState(null);
    const fileInputRef = useRef(null);

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

    //clear the chosen file 
    const handleRemoveFile = () => {
        setImageFile(null);
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDelete = async (commentId) => {
        if(!window.confirm('Delete this comment? This cannot be undone')) return;

        try{
            await api.delete(`/comments/${commentId}`, authHeader);
            loadComments();
        } catch(err){
            setError('Failed to delete the comment');
        }
    };

    // Posts a new comment to the backend, then re-fetches the full comment
    // list so the UI always reflects exactly what's in the database.
    const handleSubmit = async() => {
        if (!body.trim()) return; // Don't allow empty comments

        setPosting(true);
        setError('');
        try{
            const formData = new FormData();
            formData.append('body', body);
            formData.append('is_internal', isInternal ? 1 : 0);
            if(imageFile) formData.append('image', imageFile);

            await api.post(`/tickets/${ticketId}/comments`, formData, {
                 headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data'},
            });

            //Clear the input fields and reload comments after successful submission
            setBody('');
            setIsInternal(false);
            handleRemoveFile();
            loadComments();
        } catch (err) {
            const data = err.response?.data;
            const message = data?.error || (data?.errors ? Object.values(data.errors).flat().join(' ') : 'Failed to post comment');
            setError(message);
        } finally {
            setPosting(false);
        }
    };

     return(
        <div>
            <h3>Comments</h3>

            {loading && <p className="text-secondary">Loading comments...</p>}
            {error && <p className="error-text">{error}</p>}

            {!loading && comments.length === 0 && <p className="empty-state">No comments yet.</p>}

            <ul style={{listStyleType: 'none', padding: 0, margin: 0}}>
                {comments.map(comment => (
                    <li key={comment.id} style={{marginBottom: '0.9rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                            <div>
                                <strong>{comment.user?.name}</strong>
                                {' '}
                                <span className="text-secondary" style={{fontSize: '0.85em'}}>
                                    {new Date(comment.created_at).toLocaleString()}
                                </span>
                                {comment.is_internal && (
                                    <span className="pill pill-cancelled" style={{marginLeft: '0.5rem'}}>
                                        Internal
                                    </span>
                                )}
                            </div>
                            {(comment.user_id === user.id || role === 'Admin') && (
                                <button
                                    onClick={() => handleDelete(comment.id)}
                                    className="btn btn-secondary"
                                    style={{padding: '0.1rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger)'}}
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                        
                        <p style={{margin: '0.35rem 0 0 0'}}>{comment.body}</p>
                        {comment.attachment && (
                            <a href={`http://127.0.0.1:8000/storage/${comment.attachment.file_path}`} target="_blank" rel="noreferrer">
                                <img
                                    src={`http://127.0.0.1:8000/storage/${comment.attachment.file_path}`}
                                    alt={comment.attachment.file_name}
                                    style={{maxWidth: '200px', maxHeight: '200px', marginTop: '0.5rem', display: 'block', borderRadius: 'var(--radius-sm)'}}
                                />
                            </a>
                        )}
                    </li>
                ))}
            </ul>

            <div className="card" style={{marginTop: '1rem'}}>
                <textarea
                    className="form-textarea"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={3}
                    placeholder="Write a comment..."
                />

                <div style={{marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap'}}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files[0] || null)}
                    />
                    {imageFile && (
                        <span style={{fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem'}}>
                            {imageFile.name}
                            <button
                                type="button"
                                onClick={handleRemoveFile}
                                className="btn btn-secondary"
                                style={{padding: '0.1rem 0.5rem', fontSize: '0.75rem'}}
                                title="Remove selected file"
                            >
                                ✕
                            </button>
                        </span>
                    )}
                </div>
                <p className="text-secondary" style={{fontSize: '0.8rem', marginTop: '0.3rem'}}>
                    Optional image (jpg, jpeg, png, gif — 1-10MB)
                </p>

                {isAgent && (
                    <div style={{marginTop: '0.4rem'}}>
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
                <button
                    className="btn btn-primary"
                    style={{marginTop: '0.75rem'}}
                    disabled={posting || !body.trim()}
                    onClick={handleSubmit}
                >
                    {posting ? 'Posting...' : 'Post Comment'}
                </button>
            </div>
        </div>
    );
}

export default TicketComments;
    