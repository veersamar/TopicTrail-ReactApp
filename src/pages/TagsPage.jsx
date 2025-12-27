import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

function TagsPage() {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMode, setFilterMode] = useState('name'); // name, popular

    useEffect(() => {
        const fetchTags = async () => {
            setLoading(true);
            try {
                const data = await api.getTags();
                setTags(data);
            } catch (error) {
                console.error("Failed to load tags", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTags();
    }, []);

    const filteredTags = tags
        .filter(tag => {
            const name = tag.name || tag.Name || tag.tagName || tag.TagName || '';
            return name.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => {
            const nameA = (a.name || a.Name || a.tagName || a.TagName || '').toLowerCase();
            const nameB = (b.name || b.Name || b.tagName || b.TagName || '').toLowerCase();

            if (filterMode === 'popular') {
                // Assuming there's a count property, e.g., articleCount
                const countA = a.articleCount || a.count || 0;
                const countB = b.articleCount || b.count || 0;
                return countB - countA;
            }
            return nameA.localeCompare(nameB);
        });

    if (loading) {
        return (
            <div className="p-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <h2 className="mb-4">Tags</h2>
            <p className="text-secondary mb-4">
                A tag is a keyword or label that categorizes your question with other, similar questions.
                Using the right tags makes it easier for others to find and answer your question.
            </p>

            <div className="row mb-4">
                <div className="col-md-6 mb-2">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Filter by tag name"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="col-md-6 mb-2 d-flex justify-content-md-end">
                    <div className="btn-group" role="group">
                        <button
                            type="button"
                            className={`btn btn-outline-secondary ${filterMode === 'name' ? 'active' : ''}`}
                            onClick={() => setFilterMode('name')}
                        >
                            Name
                        </button>
                        <button
                            type="button"
                            className={`btn btn-outline-secondary ${filterMode === 'popular' ? 'active' : ''}`}
                            onClick={() => setFilterMode('popular')}
                        >
                            Popular
                        </button>
                    </div>
                </div>
            </div>

            <div className="row g-3">
                {filteredTags.map((tag, idx) => {
                    const tagName = tag.name || tag.Name || tag.tagName || tag.TagName || 'Unknown';
                    const count = tag.articleCount || tag.count || 0;
                    const description = tag.description || tag.Description || ''; // In case description exists

                    return (
                        <div key={idx} className="col-12 col-sm-6 col-md-4 col-lg-3">
                            <div className="card h-100 shadow-sm border-0">
                                <div className="card-body">
                                    <Link
                                        to={`/articles?tag=${encodeURIComponent(tagName)}`}
                                        className="badge bg-light text-primary text-decoration-none border border-light-subtle mb-2"
                                        style={{ fontSize: '0.9rem' }}
                                    >
                                        {tagName}
                                    </Link>
                                    <div className="small text-muted mb-2 text-truncate-3" style={{ minHeight: '20px' }}>
                                        {description}
                                    </div>
                                    <div className="small text-secondary fw-bold">
                                        {count} question{count !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {filteredTags.length === 0 && (
                    <div className="col-12 text-center text-muted py-5">
                        No tags found matching "{searchTerm}".
                    </div>
                )}
            </div>

            <style>{`
            .text-truncate-3 {
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
        `}</style>
        </div>
    );
}

export default TagsPage;
