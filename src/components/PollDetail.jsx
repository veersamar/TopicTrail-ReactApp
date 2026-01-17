import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

/**
 * PollDetail - Full poll voting and results experience
 * 
 * Handles:
 * - Displaying poll questions
 * - Vote submission (single/multiple choice, rating, short answer)
 * - Results visualization
 * - Respecting poll settings (one vote per user, vote change, etc.)
 */
function PollDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, userId } = useAuth();
    const hasFetched = useRef(false);

    // ========== STATE ==========
    const [pageState, setPageState] = useState({
        poll: null,
        loading: true,
        error: null,
        submitting: false,
        hasVoted: false,
        showResults: false,
        voteSuccess: false,
    });

    // User's answers - keyed by questionId
    const [userAnswers, setUserAnswers] = useState({});

    // Results state
    const [results, setResults] = useState(null);
    const [resultsLoading, setResultsLoading] = useState(false);
    const [resultsError, setResultsError] = useState(null);

    // ========== FETCH RESULTS ==========
    const fetchResults = useCallback(async () => {
        try {
            setResultsLoading(true);
            setResultsError(null);

            const response = await api.getPollResults(token, id);

            if (!response.success) {
                if (response.forbidden) {
                    setResultsError('Results are not available yet');
                } else {
                    setResultsError(response.error || 'Failed to fetch results');
                }
                setResultsLoading(false);
                return;
            }

            setResults(response.results || response);
            setResultsLoading(false);
        } catch (error) {
            console.error('Error fetching results:', error);
            setResultsError(error.message || 'Failed to fetch results');
            setResultsLoading(false);
        }
    }, [id, token]);

    // ========== CHECK RESULTS VISIBILITY ==========
    const shouldShowResults = useCallback((poll, hasVoted) => {
        const visibility = poll.resultVisibility || poll.ResultVisibility;
        const endDate = poll.endDate || poll.EndDate;
        const hasEnded = endDate && new Date(endDate) < new Date();

        // 1 = AfterVoting, 2 = AfterPollEnds, 3 = AdminOnly
        if (visibility === 1 && hasVoted) return true;
        if (visibility === 2 && hasEnded) return true;
        if (visibility === 3 && poll.isCreator) return true;

        return false;
    }, []);

    // ========== FETCH POLL ==========
    const fetchPoll = useCallback(async () => {
        try {
            setPageState(prev => ({ ...prev, loading: true, error: null }));

            const poll = await api.getPollById(token, id);

            if (!poll) {
                setPageState(prev => ({
                    ...prev,
                    error: 'Poll not found',
                    loading: false,
                }));
                return;
            }

            console.log('Poll fetched:', poll);

            // Check if user has already voted
            const hasVoted = poll.hasVoted || poll.userVote || poll.HasVoted || poll.UserVote;

            setPageState(prev => ({
                ...prev,
                poll,
                hasVoted: !!hasVoted,
                loading: false,
            }));

            // If user has voted, pre-fill their answers and show results
            if (hasVoted && poll.userAnswers) {
                setUserAnswers(poll.userAnswers);
            }

            // Fetch results if appropriate
            if (hasVoted || shouldShowResults(poll, !!hasVoted)) {
                fetchResults();
            }

        } catch (error) {
            console.error('Error fetching poll:', error);
            setPageState(prev => ({
                ...prev,
                error: error.message || 'Failed to load poll',
                loading: false,
            }));
        }
    }, [id, token, fetchResults, shouldShowResults]);

    // ========== FETCH POLL ON MOUNT ==========
    useEffect(() => {
        if (!id || !token) {
            setPageState(prev => ({
                ...prev,
                error: 'Invalid poll or authentication',
                loading: false,
            }));
            return;
        }

        if (hasFetched.current) return;
        hasFetched.current = true;

        fetchPoll();
    }, [id, token, fetchPoll]);

    // ========== HANDLE ANSWER CHANGE ==========
    const handleAnswerChange = (questionId, value, pollType) => {
        setUserAnswers(prev => {
            const newAnswers = { ...prev };

            // Handle different poll types
            switch (pollType) {
                case 1: // SingleChoice
                    newAnswers[questionId] = { selectedOptionIds: [value] };
                    break;
                case 2: // MultipleChoice
                    const currentOptions = newAnswers[questionId]?.selectedOptionIds || [];
                    if (currentOptions.includes(value)) {
                        newAnswers[questionId] = {
                            selectedOptionIds: currentOptions.filter(id => id !== value)
                        };
                    } else {
                        newAnswers[questionId] = {
                            selectedOptionIds: [...currentOptions, value]
                        };
                    }
                    break;
                case 3: // RatingScale
                    newAnswers[questionId] = { ratingValue: value };
                    break;
                case 4: // ShortAnswer
                    newAnswers[questionId] = { textAnswer: value };
                    break;
                default:
                    break;
            }

            return newAnswers;
        });
    };

    // ========== SUBMIT VOTE ==========
    const handleSubmitVote = async () => {
        const poll = pageState.poll;
        if (!poll) return;

        // Validate answers
        const questions = poll.questions || poll.Questions || [];
        const missingAnswers = questions.filter(q => {
            const qId = q.id || q.Id;
            const answer = userAnswers[qId];
            if (!answer) return true;

            const pollType = q.pollType || q.PollType;
            if ((pollType === 1 || pollType === 2) && (!answer.selectedOptionIds || answer.selectedOptionIds.length === 0)) {
                return true;
            }
            if (pollType === 3 && !answer.ratingValue) return true;
            // Short answer is optional
            return false;
        });

        if (missingAnswers.length > 0) {
            setPageState(prev => ({
                ...prev,
                error: 'Please answer all questions before submitting',
            }));
            return;
        }

        try {
            setPageState(prev => ({ ...prev, submitting: true, error: null }));

            // Build vote submission data
            const answers = questions.map(q => {
                const qId = q.id || q.Id;
                const answer = userAnswers[qId] || {};
                return {
                    PollQuestionId: qId,
                    SelectedOptionIds: answer.selectedOptionIds || null,
                    RatingValue: answer.ratingValue || null,
                    TextAnswer: answer.textAnswer || null,
                };
            });

            const voteData = {
                PollId: parseInt(id, 10),
                UserId: userId ? parseInt(userId, 10) : null,
                AnonymousSessionId: userId ? null : getAnonymousSessionId(),
                Answers: answers,
            };

            console.log('Submitting vote:', voteData);

            const result = await api.submitPollVote(token, voteData);

            if (!result.success) {
                setPageState(prev => ({
                    ...prev,
                    submitting: false,
                    error: result.error || 'Failed to submit vote',
                }));
                return;
            }

            setPageState(prev => ({
                ...prev,
                submitting: false,
                hasVoted: true,
                voteSuccess: true,
                showResults: true,
            }));

            // Fetch results after voting
            fetchResults();

        } catch (error) {
            console.error('Error submitting vote:', error);
            setPageState(prev => ({
                ...prev,
                submitting: false,
                error: error.message || 'Failed to submit vote',
            }));
        }
    };

    // ========== ANONYMOUS SESSION ID ==========
    const getAnonymousSessionId = () => {
        let sessionId = localStorage.getItem('poll_anonymous_session');
        if (!sessionId) {
            sessionId = 'anon_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('poll_anonymous_session', sessionId);
        }
        return sessionId;
    };

    // ========== GET POLL TYPE NAME ==========
    const getPollTypeName = (type) => {
        const types = {
            1: 'Single Choice',
            2: 'Multiple Choice',
            3: 'Rating Scale',
            4: 'Short Answer',
        };
        return types[type] || 'Unknown';
    };

    // ========== RENDER QUESTION ==========
    const renderQuestion = (question, index) => {
        const qId = question.id || question.Id;
        const qText = question.questionText || question.QuestionText || question.text || question.Text;
        const pollType = question.pollType || question.PollType;
        const options = question.options || question.Options || [];
        const minScale = question.minScale || question.MinScale || 1;
        const maxScale = question.maxScale || question.MaxScale || 5;

        const isDisabled = pageState.hasVoted && !pageState.poll?.allowVoteChange;
        const answer = userAnswers[qId] || {};

        return (
            <div key={qId} className="mb-4 p-4 border rounded bg-white">
                <div className="d-flex align-items-start mb-3">
                    <span className="badge bg-primary me-2">{index + 1}</span>
                    <div className="flex-grow-1">
                        <h5 className="mb-1 fw-bold">{qText}</h5>
                        <small className="text-muted">{getPollTypeName(pollType)}</small>
                    </div>
                </div>

                {/* Single Choice */}
                {pollType === 1 && (
                    <div className="ps-4">
                        {options.map(opt => {
                            const optId = opt.id || opt.Id;
                            const optText = opt.optionText || opt.OptionText || opt.text || opt.Text;
                            const isSelected = answer.selectedOptionIds?.includes(optId);

                            return (
                                <div key={optId} className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name={`question_${qId}`}
                                        id={`opt_${optId}`}
                                        checked={isSelected}
                                        onChange={() => handleAnswerChange(qId, optId, pollType)}
                                        disabled={isDisabled}
                                    />
                                    <label className="form-check-label" htmlFor={`opt_${optId}`}>
                                        {optText}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Multiple Choice */}
                {pollType === 2 && (
                    <div className="ps-4">
                        {options.map(opt => {
                            const optId = opt.id || opt.Id;
                            const optText = opt.optionText || opt.OptionText || opt.text || opt.Text;
                            const isSelected = answer.selectedOptionIds?.includes(optId);

                            return (
                                <div key={optId} className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`opt_${optId}`}
                                        checked={isSelected}
                                        onChange={() => handleAnswerChange(qId, optId, pollType)}
                                        disabled={isDisabled}
                                    />
                                    <label className="form-check-label" htmlFor={`opt_${optId}`}>
                                        {optText}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Rating Scale */}
                {pollType === 3 && (
                    <div className="ps-4">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            {Array.from({ length: maxScale - minScale + 1 }, (_, i) => {
                                const value = minScale + i;
                                const isSelected = answer.ratingValue === value;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        className={`btn ${isSelected ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        style={{ width: '42px', height: '42px' }}
                                        onClick={() => handleAnswerChange(qId, value, pollType)}
                                        disabled={isDisabled}
                                    >
                                        {value}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="d-flex justify-content-between mt-1 text-muted small">
                            <span>{minScale} - Low</span>
                            <span>{maxScale} - High</span>
                        </div>
                    </div>
                )}

                {/* Short Answer */}
                {pollType === 4 && (
                    <div className="ps-4">
                        <textarea
                            className="form-control"
                            rows={3}
                            placeholder="Enter your answer..."
                            value={answer.textAnswer || ''}
                            onChange={(e) => handleAnswerChange(qId, e.target.value, pollType)}
                            disabled={isDisabled}
                        />
                    </div>
                )}
            </div>
        );
    };

    // ========== RENDER RESULTS ==========
    const renderResults = () => {
        if (resultsLoading) {
            return (
                <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted">Loading results...</p>
                </div>
            );
        }

        if (resultsError) {
            return (
                <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {resultsError}
                </div>
            );
        }

        if (!results) return null;

        const questions = results.questions || results.Questions || [];
        const totalResponses = results.totalResponses || results.TotalResponses || 0;

        return (
            <div className="mt-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h4 className="mb-0">
                        <i className="bi bi-bar-chart-fill me-2"></i>Results
                    </h4>
                    <span className="badge bg-secondary">
                        {totalResponses} response{totalResponses !== 1 ? 's' : ''}
                    </span>
                </div>

                {questions.map((q, idx) => renderQuestionResult(q, idx))}
            </div>
        );
    };

    // ========== RENDER QUESTION RESULT ==========
    const renderQuestionResult = (question, index) => {
        const qText = question.questionText || question.QuestionText || question.text || question.Text;
        const pollType = question.pollType || question.PollType;
        const options = question.options || question.Options || [];
        const totalVotes = question.totalVotes || question.TotalVotes || 0;
        const avgRating = question.averageRating || question.AverageRating;
        const textAnswers = question.textAnswers || question.TextAnswers || [];

        return (
            <div key={index} className="mb-4 p-4 border rounded bg-white">
                <h6 className="fw-bold mb-3">
                    <span className="badge bg-secondary me-2">{index + 1}</span>
                    {qText}
                </h6>

                {/* Choice Results - Bar Chart */}
                {(pollType === 1 || pollType === 2) && (
                    <div>
                        {options.map(opt => {
                            const optText = opt.optionText || opt.OptionText || opt.text || opt.Text;
                            const votes = opt.voteCount || opt.VoteCount || 0;
                            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

                            return (
                                <div key={opt.id || opt.Id} className="mb-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span>{optText}</span>
                                        <span className="text-muted">{votes} ({percentage}%)</span>
                                    </div>
                                    <div className="progress" style={{ height: '20px' }}>
                                        <div
                                            className="progress-bar"
                                            role="progressbar"
                                            style={{ width: `${percentage}%` }}
                                            aria-valuenow={percentage}
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                        >
                                            {percentage > 10 && `${percentage}%`}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="text-muted small mt-2">
                            Total votes: {totalVotes}
                        </div>
                    </div>
                )}

                {/* Rating Results */}
                {pollType === 3 && (
                    <div>
                        <div className="d-flex align-items-center gap-3 mb-3">
                            <div className="text-center p-3 bg-primary text-white rounded" style={{ minWidth: '80px' }}>
                                <div className="fs-3 fw-bold">{avgRating ? avgRating.toFixed(1) : '—'}</div>
                                <small>Average</small>
                            </div>
                            <div className="flex-grow-1">
                                {/* Rating distribution */}
                                {options.map(opt => {
                                    const value = opt.value || opt.Value;
                                    const votes = opt.voteCount || opt.VoteCount || 0;
                                    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

                                    return (
                                        <div key={value} className="d-flex align-items-center gap-2 mb-1">
                                            <span style={{ width: '20px' }}>{value}</span>
                                            <div className="progress flex-grow-1" style={{ height: '12px' }}>
                                                <div
                                                    className="progress-bar bg-warning"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-muted small" style={{ width: '40px' }}>{votes}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="text-muted small">
                            Based on {totalVotes} rating{totalVotes !== 1 ? 's' : ''}
                        </div>
                    </div>
                )}

                {/* Short Answer Results */}
                {pollType === 4 && (
                    <div>
                        {textAnswers.length > 0 ? (
                            <div className="list-group">
                                {textAnswers.slice(0, 10).map((ans, idx) => (
                                    <div key={idx} className="list-group-item">
                                        <i className="bi bi-chat-quote text-muted me-2"></i>
                                        {ans.text || ans.Text || ans}
                                    </div>
                                ))}
                                {textAnswers.length > 10 && (
                                    <div className="list-group-item text-muted text-center">
                                        +{textAnswers.length - 10} more responses
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted fst-italic">No text responses yet</p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // ========== LOADING STATE ==========
    if (pageState.loading) {
        return (
            <div className="container-lg my-5" style={{ maxWidth: '800px' }}>
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                        <div className="spinner-border text-primary mb-3" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="text-muted">Loading poll...</p>
                    </div>
                </div>
            </div>
        );
    }

    // ========== ERROR STATE ==========
    if (pageState.error || !pageState.poll) {
        return (
            <div className="container-lg my-5" style={{ maxWidth: '800px' }}>
                <button
                    className="btn btn-outline-primary mb-3"
                    onClick={() => navigate('/articles')}
                >
                    <i className="bi bi-arrow-left me-2"></i>Back
                </button>
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {pageState.error || 'Poll not found'}
                </div>
            </div>
        );
    }

    const { poll, hasVoted, submitting, voteSuccess, showResults } = pageState;
    const title = poll.title || poll.Title;
    const description = poll.description || poll.Description;
    const questions = poll.questions || poll.Questions || [];
    const categoryName = poll.categoryName || poll.CategoryName || 'General';
    const creatorName = poll.creatorName || poll.CreatorName || 'Anonymous';
    const createdDate = poll.createdDate || poll.CreatedDate;
    const endDate = poll.endDate || poll.EndDate;
    const allowVoteChange = poll.allowVoteChange || poll.AllowVoteChange;
    const isPollClosed = endDate && new Date(endDate) < new Date();

    return (
        <div className="container-lg my-4" style={{ maxWidth: '800px' }}>
            {/* Back Button */}
            <button
                className="btn btn-link text-decoration-none p-0 mb-4 text-muted"
                onClick={() => navigate('/articles')}
            >
                <i className="bi bi-arrow-left me-2"></i>Back to Articles
            </button>

            {/* Poll Header */}
            <div className="bg-white rounded shadow-sm p-4 mb-4">
                <div className="d-flex align-items-start justify-content-between">
                    <div>
                        <span className="badge bg-primary-subtle text-primary mb-2">{categoryName}</span>
                        <h2 className="fw-bold mb-2">{title}</h2>
                        {description && <p className="text-muted mb-3">{description}</p>}
                    </div>
                    <span className="badge bg-secondary-subtle text-secondary fs-6 px-3 py-2">
                        <i className="bi bi-bar-chart-fill me-1"></i>Poll
                    </span>
                </div>

                <div className="d-flex gap-4 text-muted small">
                    <span><i className="bi bi-person me-1"></i>{creatorName}</span>
                    {createdDate && (
                        <span>
                            <i className="bi bi-calendar3 me-1"></i>
                            {new Date(createdDate).toLocaleDateString()}
                        </span>
                    )}
                    {endDate && (
                        <span className={isPollClosed ? 'text-danger' : ''}>
                            <i className="bi bi-clock me-1"></i>
                            {isPollClosed ? 'Ended' : `Ends ${new Date(endDate).toLocaleDateString()}`}
                        </span>
                    )}
                </div>
            </div>

            {/* Success Message */}
            {voteSuccess && (
                <div className="alert alert-success d-flex align-items-center mb-4">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Thank you! Your vote has been recorded.
                </div>
            )}

            {/* Poll Closed Alert */}
            {isPollClosed && !hasVoted && (
                <div className="alert alert-warning d-flex align-items-center mb-4">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    This poll has ended and is no longer accepting votes.
                </div>
            )}

            {/* Already Voted Alert */}
            {hasVoted && !allowVoteChange && (
                <div className="alert alert-info d-flex align-items-center mb-4">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    You have already voted in this poll. Your answers are shown below.
                </div>
            )}

            {/* Error Alert */}
            {pageState.error && (
                <div className="alert alert-danger d-flex align-items-center mb-4">
                    <i className="bi bi-exclamation-circle-fill me-2"></i>
                    {pageState.error}
                    <button
                        type="button"
                        className="btn-close ms-auto"
                        onClick={() => setPageState(prev => ({ ...prev, error: null }))}
                    ></button>
                </div>
            )}

            {/* Questions */}
            {!showResults && (
                <div className="questions-section">
                    <h4 className="mb-3">
                        <i className="bi bi-list-check me-2"></i>
                        Questions ({questions.length})
                    </h4>
                    {questions.map((q, idx) => renderQuestion(q, idx))}
                </div>
            )}

            {/* Submit Button */}
            {!hasVoted && !isPollClosed && (
                <div className="d-flex justify-content-end gap-3 mb-4">
                    <button
                        type="button"
                        className="btn btn-primary btn-lg px-5"
                        onClick={handleSubmitVote}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check2-circle me-2"></i>
                                Submit Vote
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Change Vote Button */}
            {hasVoted && allowVoteChange && !isPollClosed && (
                <div className="d-flex justify-content-end gap-3 mb-4">
                    <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={handleSubmitVote}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Updating...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-pencil me-2"></i>
                                Update Vote
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Toggle Results Button */}
            {hasVoted && (
                <div className="d-flex justify-content-center mb-4">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => {
                            setPageState(prev => ({ ...prev, showResults: !prev.showResults }));
                            if (!results && !showResults) {
                                fetchResults();
                            }
                        }}
                    >
                        <i className={`bi bi-${showResults ? 'list-check' : 'bar-chart'} me-2`}></i>
                        {showResults ? 'View Questions' : 'View Results'}
                    </button>
                </div>
            )}

            {/* Results Section */}
            {(showResults || hasVoted) && renderResults()}
        </div>
    );
}

export default PollDetail;
