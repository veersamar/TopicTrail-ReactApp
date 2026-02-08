import React, { useState, useEffect, useMemo } from 'react';
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
    const filteredPolls = useMemo(() => {
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
            {/* Page Header - matches ArticlesFeed style */}
            <header className="page-header">
                <h1 className="page-header__title">Polls</h1>
            </header>

            <div className="feed__toolbar">
                <span className="text-sm text-secondary">{filteredPolls.length} polls</span>

                <div className="btn-group">
                    <button
                        type="button"
                        className={`btn btn-sm ${filterMode === 'newest' ? 'btn-secondary btn-group--active' : 'btn-ghost'}`}
                        onClick={() => setFilterMode('newest')}
                    >Newest</button>
                    <button
                        type="button"
                        className={`btn btn-sm ${filterMode === 'active' ? 'btn-secondary btn-group--active' : 'btn-ghost'}`}
                        onClick={() => setFilterMode('active')}
                    >Active</button>
                    <button
                        type="button"
                        className={`btn btn-sm ${filterMode === 'ending-soon' ? 'btn-secondary btn-group--active' : 'btn-ghost'}`}
                        onClick={() => setFilterMode('ending-soon')}
                    >Ending Soon</button>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger">{error}</div>
            )}

            {/* Polls List - matches ArticleCard style */}
            <div className="feed__list">
                {filteredPolls.length > 0 ? (
                    filteredPolls.map(poll => {
                        const pollId = poll.id || poll.Id || poll.pollId || poll.PollId;
                        const endDate = poll.endDate || poll.EndDate;
                        const isPollEnded = endDate && new Date(endDate) < new Date();
                        const voteCount = poll.voteCount || poll.VoteCount || poll.totalVotes || 0;
                        const questionCount = poll.questionCount || poll.QuestionCount || 1;
                        const creatorName = poll.creatorName || poll.CreatorName || 'Anonymous';
                        const createdDate = poll.createdOn || poll.CreatedOn || poll.createdDate || poll.CreatedDate;
                        
                        return (
                            <article 
                                key={pollId} 
                                className="article-card"
                            >
                                {/* Stats Column */}
                                <div className="article-card__stats">
                                    <div className="article-card__stat">
                                        <span className="article-card__stat-value">{voteCount}</span>
                                        <span className="article-card__stat-label">votes</span>
                                    </div>
                                    <div className="article-card__stat">
                                        <span className="article-card__stat-value">{questionCount}</span>
                                        <span className="article-card__stat-label">questions</span>
                                    </div>
                                    {endDate && (
                                        <div className={`article-card__stat ${isPollEnded ? 'article-card__stat--danger' : 'article-card__stat--warning'}`}>
                                            <span className="article-card__stat-value" style={{ fontSize: '0.75rem' }}>
                                                {getTimeRemaining(endDate)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Content Column */}
                                <div className="article-card__content">
                                    <h3 className="article-card__title">
                                        <Link 
                                            to={`/poll/${pollId}`}
                                            className="article-card__link"
                                        >
                                            {poll.title || poll.Title}
                                        </Link>
                                    </h3>

                                    {(poll.description || poll.Description) && (
                                        <p className="article-card__excerpt">
                                            {(poll.description || poll.Description).substring(0, 200)}...
                                        </p>
                                    )}

                                    <div className="article-card__footer">
                                        <div className="article-card__tags">
                                            <span className="badge badge--secondary">poll</span>
                                        </div>

                                        <div className="article-card__meta">
                                            <span className="article-card__author">{creatorName}</span>
                                            <span className="article-card__date">created {formatDate(createdDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })
                ) : (
                    <div className="empty-state">
                        <h4 className="empty-state__title">No polls yet</h4>
                        <p className="empty-state__description">Be the first to create a poll and gather opinions!</p>
                        <button 
                            className="btn btn-primary"
                            onClick={() => navigate('/create-poll')}
                        >
                            Create Your First Poll
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PollsPage;
