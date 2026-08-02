import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from './api.js';
import { useAuth } from './AuthContext.jsx';

function CreateTicket() {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const canCreate = user?.role?.name === 'Employee' || user?.role?.name === 'Admin';

    const [categories, setCategories] = useState([]);
    const [priorities, setPriorities] = useState([]);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [priorityId, setPriorityId] = useState('');

    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const authHeader = { headers: { Authorization: `Bearer ${token}` } };

        Promise.all([
            api.get('/categories', authHeader),
            api.get('/priorities', authHeader),
        ])
            .then(([categoriesRes, prioritiesRes]) => {
                setCategories(categoriesRes.data);
                setPriorities(prioritiesRes.data);
            })
            .catch(() => setError('Failed to load categories/priorities'));
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const response = await api.post(
                '/tickets',
                {
                    title,
                    description,
                    category_id: categoryId,
                    priority_id: priorityId,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            navigate(`/tickets/${response.data.id}`);
        } catch (err) {
            if (err.response?.data) {
                const messages = Object.values(err.response.data).flat().join(' ');
                setError(messages || 'Failed to create ticket');
            } else {
                setError('Failed to create ticket');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if(!canCreate) {
        return <Navigate to ="/tickets"  />;
    }

    return (
        <div>
            <h1>New Ticket</h1>

            <p><Link to="/tickets">Back to Ticket List</Link></p>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Title</label><br />
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={150}
                        required
                    />
                </div>

                <div>
                    <label>Description</label><br />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                        required
                    />
                </div>

                <div>
                    <label>Category</label><br />
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        required
                    >
                        <option value="">-- Select a category --</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Priority</label><br />
                    <select
                        value={priorityId}
                        onChange={(e) => setPriorityId(e.target.value)}
                        required
                    >
                        <option value="">-- Select a priority --</option>
                        {priorities.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {error && <p style={{ color: 'red' }}>{error}</p>}

                <button type="submit" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Ticket'}
                </button>
            </form>
        </div>
    );
}

export default CreateTicket;

/**
 * A simple form: title, description, category dropdown, priority dropdown. 
 * When submitted, it POSTs to /tickets
 */