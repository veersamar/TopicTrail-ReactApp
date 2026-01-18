import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function PollsPage() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterMode, setFilterMode] = useState('newest'); // newest, active, ending-soon

    useEffect(() => {
        const loadPolls = async () => {
            setLoading(true);
            setError(null);
            try {
                // Try to fetch polls from the API
                const data = await api.getAllPolls(token);
                console.log('Fetched polls:', data);
                setPolls(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Error loading polls:', err);
                setError('Failed to load polls.');
            } finally {
                setLoading(false);
            }
        };

        loadPolls();
    }, [token]);

    // Filter & Sort
    const filteredPolls = React.useMemo(() => {
        let filtered = [...polls];

        if (filterMode === 'newest') {
            filtered.sort((a, b) => new Date(b.createdOn || b.CreatedOn || b.createdDate || b.CreatedDate) - new Date(a.createdOn || a.CreatedOn || a.createdDate || a.CreatedDate));
        } else if (filterMode === 'active') {
            filtered = filtered.filter(p => {
                const endDate = p.endDate || p.EndDate;
                return !endDate || new Date(endDate) > new Date();
            });
        } else if (filterMode === 'ending-soon') {
            filtered = filtered.filter(p => {
                const endDate = p.endDate || p.EndDate;
                if (!endDate) return false;
                const daysLeft = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
                return daysLeft > 0 && daysLeft <= 7;
            });
            filtered.sort((a, b) => new Date(a.endDate || a.EndDate) - new Date(b.endDate || b.EndDate));
        }

        return filtered;
    }, [polls, filterMode]);

    const formatDate = (dateString) => {
        if (!dateString) return 'No deadline';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    const getTimeRemaining = (endDate) => {
        if (!endDate) return null;
        const end = new Date(endDate);
        const now = new Date();
        const diff = end - now;
        
        if (diff <= 0) return 'Ended';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
        
        return 'Ending soon';
    };

    if (loading) {
        return (
            <div className="py-5 text-center">
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    return (
        <div className="polls-page">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-3">
                <h3 className="mb-0 fw-normal">📊 Polls</h3>
                <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/create-poll')}
                >
                    + Create Poll
                </button>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="fs-5 text-secondary">{filteredPolls.length} polls</div>

                <div className="btn-group btn-group-sm outline-group" role="group">
                    <button
                        type="button"
                        className={`btn btn-outline-secondary ${filterMode === 'newest' ? 'active' : ''}`}
                        onClick={() => setFilterMode('newest')}
                    >Newest</button>
                    <button
                        type="button"
                        className={`btn btn-outline-secondary ${filterMode === 'active' ? 'active' : ''}`}
                        onClick={() => setFilterMode('active')}
                    >Active</button>
                    <button
                        type="button"
                        className={`btn btn-outline-secondary ${filterMode === 'ending-soon' ? 'active' : ''}`}
                        onClick={() => setFilterMode('ending-soon')}
                    >Ending Soon</button>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger">{error}</div>
            )}

            {/* Polls List */}
            <div className="d-flex flex-column border-top">
                {filteredPolls.length > 0 ? (
                    filteredPolls.map(poll => (
                        <div 
                            key={poll.id || poll.Id || poll.pollId || poll.PollId} 
                            className="poll-card p-3 border-bottom"
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/poll/${poll.id || poll.Id || poll.pollId || poll.PollId}`)}
                        >
                            <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                    <h5 className="mb-1">
                                        <Link 
                                            to={`/poll/${poll.id || poll.Id || poll.pollId || poll.PollId}`}
                                            className="text-decoration-none text-dark"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {poll.title || poll.Title}
                                        </Link>
                                    </h5>
                                    {(poll.description || poll.Description) && (
                                        <p className="text-muted small mb-2 text-truncate-2">
                                            {poll.description || poll.Description}
                                        </p>
                                    )}
                                    <div className="d-flex gap-3 small text-muted">
                                        <span>📅 Created: {formatDate(poll.createdOn || poll.CreatedOn || poll.createdDate || poll.CreatedDate)}</span>
                                        {(poll.endDate || poll.EndDate) && (
                                            <span className={getTimeRemaining(poll.endDate || poll.EndDate) === 'Ended' ? 'text-danger' : 'text-warning'}>
                                                ⏰ {getTimeRemaining(poll.endDate || poll.EndDate)}
                                            </span>
                                        )}
                                        {(poll.voteCount !== undefined || poll.VoteCount !== undefined || poll.totalVotes !== undefined) && (
                                            <span>🗳️ {poll.voteCount || poll.VoteCount || poll.totalVotes || 0} votes</span>
                                        )}
                                        {(poll.questionCount !== undefined || poll.QuestionCount !== undefined) && (
                                            <span>❓ {poll.questionCount || poll.QuestionCount || 1} questions</span>
                                        )}
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className={`badge ${poll.isPublic || poll.IsPublic ? 'bg-success' : 'bg-secondary'}`}>
                                        {poll.isPublic || poll.IsPublic ? 'Public' : 'Private'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-5 text-center text-muted">
                        <div className="mb-3" style={{ fontSize: '3rem' }}>📊</div>
                        <h5>No polls yet</h5>
                        <p className="mb-3">Be the first to create a poll and gather opinions!</p>
                        <button 
                            className="btn btn-primary"
                            onClick={() => navigate('/create-poll')}
                        >
                            Create Your First Poll
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                .outline-group .btn-outline-secondary {
                    border-color: #9fa6ad;
                    color: #6a737c;
                }
                .outline-group .btn-outline-secondary:hover {
                    background-color: #f8f9f9;
                    color: #525960;
                }
                .outline-group .btn-outline-secondary.active {
                    background-color: #e3e6e8;
                    color: #3b4045;
                    border-color: #9fa6ad;
                }
                .poll-card:hover {
                    background-color: #f8f9f9;
                }
                .text-truncate-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}

export default PollsPage;
