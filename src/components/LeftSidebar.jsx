import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function LeftSidebar() {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const currentType = query.get('type');
    const isArticlesPage = location.pathname === '/articles';

    return (
        <nav className="left-sidebar pt-4 sticky-top" style={{ top: '60px', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
            <ul className="list-unstyled">
                {/* Main Feeds */}
                <li className="mb-2">
                    <Link
                        to="/articles"
                        className={`d-block px-3 py-2 text-decoration-none small ${isArticlesPage && !currentType ? 'fw-bold text-dark border-end border-3 border-orange' : 'text-secondary'}`}
                        style={{
                            backgroundColor: isArticlesPage && !currentType ? '#F1F2F3' : 'transparent',
                            borderColor: isArticlesPage && !currentType ? 'var(--primary-color)' : 'transparent'
                        }}
                    >
                        🏠 Home
                    </Link>
                </li>

                <li className="mb-1 px-3 small text-uppercase text-muted fw-bold mt-3" style={{ fontSize: '0.75rem' }}>
                    Filter By Type
                </li>

                <li className="mb-0">
                    <Link
                        to="/articles?type=post"
                        className={`d-flex align-items-center gap-2 px-3 py-2 text-decoration-none small ${isArticlesPage && currentType === 'post' ? 'fw-bold text-dark bg-light border-end border-3 border-primary' : 'text-secondary'}`}
                    >
                        📝 Posts
                    </Link>
                </li>
                <li className="mb-0">
                    <Link
                        to="/articles?type=question"
                        className={`d-flex align-items-center gap-2 px-3 py-2 text-decoration-none small ${isArticlesPage && currentType === 'question' ? 'fw-bold text-dark bg-light border-end border-3 border-primary' : 'text-secondary'}`}
                    >
                        ❓ Questions
                    </Link>
                </li>
                <li className="mb-0">
                    <Link
                        to="/polls"
                        className={`d-flex align-items-center gap-2 px-3 py-2 text-decoration-none small ${location.pathname === '/polls' ? 'fw-bold text-dark bg-light border-end border-3 border-primary' : 'text-secondary'}`}
                    >
                        📊 Polls
                    </Link>
                </li>

                <li className="mb-1 px-3 small text-uppercase text-muted fw-bold mt-3" style={{ fontSize: '0.75rem' }}>
                    Discover
                </li>

                <li>
                    <Link 
                        to="/communities" 
                        className={`d-block px-3 py-2 text-decoration-none small ${location.pathname === '/communities' || location.pathname.startsWith('/communities/') ? 'fw-bold text-dark bg-light' : 'text-secondary'}`}
                    >
                        🏘️ Communities
                    </Link>
                </li>
                <li>
                    <Link 
                        to="/tags" 
                        className={`d-block px-3 py-2 text-decoration-none small ${location.pathname === '/tags' ? 'fw-bold text-dark bg-light' : 'text-secondary'}`}
                    >
                        🏷️ Tags
                    </Link>
                </li>
                <li>
                    <Link 
                        to="/users" 
                        className={`d-block px-3 py-2 text-decoration-none small ${location.pathname === '/users' ? 'fw-bold text-dark bg-light' : 'text-secondary'}`}
                    >
                        👥 Users
                    </Link>
                </li>
            </ul>
        </nav>
    );
}

export default LeftSidebar;
