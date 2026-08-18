import {useState} from 'react';
import {useAuth} from './AuthContext';
import api from './api.js';

//single turn IT support chat box
function AiChatWidget(){
    const {token} = useAuth();
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] =  useState('');

    const handleAsk = async (e) => {
        e.preventDefault();
        if(!question.trim()) return;

        setLoading(true);
        setError('');
        setAnswer('');

        try{
            const response = await api.post(
                '/ai/chat',
                {question}, {headers: {Authorization: `Bearer ${token}`}}
            );
            setAnswer(response.data.answer);
        } catch (err) {
            setError('Failed to reach the assistant. Please try again');
        } finally{
            setLoading(false);
        }
    };

    return (
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', marginTop: '1.5rem' }}>
            <h3>🤖 Ask the IT Assistant</h3>
            <form onSubmit={handleAsk}>
                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g. My printer won't connect, what should I try?"
                    rows={2}
                    style={{ width: '100%' }}
                />
                <br />
                <button type="submit" disabled={loading || !question.trim()}>
                    {loading ? 'Asking...' : 'Ask'}
                </button>
            </form>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            {answer && (
                <p style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap' }}>
                    <strong>Assistant:</strong> {answer}
                </p>
            )}
        </div>
    );
}

export default AiChatWidget;
