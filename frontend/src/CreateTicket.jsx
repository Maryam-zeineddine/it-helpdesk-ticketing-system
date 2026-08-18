import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import api from './api.js';
import { useAuth } from './AuthContext.jsx';
import AiChatWidget from './AiChatWidget.jsx';

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

    //AI suggestion state
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [aiUnavailable, setAiUnavailable] = useState(false);
    const categoryTouchedByUser = useRef(false);
    const priorityTouchedByUser = useRef(false);
    const debounceTimer = useRef(null);

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

    //Ai suggestions: after 1.2s after the user stops typing
    //fires only when there is a text to analyze not on any keystroke
    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        if (!title.trim() || description.trim().length < 15) {
            return;
        }

        debounceTimer.current = setTimeout(() => {
            setAiLoading(true);
            setAiUnavailable(false);

            api.post(
                '/ai/suggest-category-priority',
                { title, description },
                { headers: { Authorization: `Bearer ${token}` } }
            )
                .then((response) => {
                    const { category, priority } = response.data;

                    if (!category || !priority) {
                        setAiUnavailable(true);
                        setAiSuggestion(null);
                        return;
                    }

                    setAiSuggestion({ category, priority });

                    //only auto-fill fields the employee hasn't already touched
                    if (!categoryTouchedByUser.current) {
                        const match = categories.find((c) => c.name === category);
                        if (match) setCategoryId(String(match.id));
                    }
                    if (!priorityTouchedByUser.current) {
                        const match = priorities.find((p) => p.name === priority);
                        if (match) setPriorityId(String(match.id));
                    }
                })
                .catch(() => {
                    setAiUnavailable(true);
                    setAiSuggestion(null);
                })
                .finally(() => setAiLoading(false));
        }, 1200);

        return () => clearTimeout(debounceTimer.current);
    }, [title, description, token, categories, priorities]);

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

    if (!canCreate) {
        return <Navigate to="/tickets" />;
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

                {aiLoading && <p style={{ color: '#888' }}>Thinking about category/priority...</p>}

                {aiSuggestion && !aiLoading && (
                    <p style={{ color: '#2a6', fontSize: '0.9rem' }}>
                        🤖 AI suggested: <strong>{aiSuggestion.category}</strong> / <strong>{aiSuggestion.priority}</strong>
                        {' '}(you can change this below)
                    </p>
                )}

                {aiUnavailable && !aiLoading && (
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>
                        AI suggestion unavailable right now — please choose manually below.
                    </p>
                )}

                <div>
                    <label>Category</label><br />
                    <select
                        value={categoryId}
                        onChange={(e) => {
                            categoryTouchedByUser.current = true;
                            setCategoryId(e.target.value);
                        }}
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
                        onChange={(e) => {
                            priorityTouchedByUser.current = true;
                            setPriorityId(e.target.value);
                        }}
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
            <AiChatWidget />
        </div>
    );
}

export default CreateTicket;

/**
 * A simple form: title, description, category dropdown, priority dropdown.
 * When submitted, it POSTs to /tickets
 */