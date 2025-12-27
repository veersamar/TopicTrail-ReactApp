import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

function LeftSidebar() {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const currentType = query.get('type');

    return (
        <nav className="left-sidebar pt-4 sticky-top" style={{ top: '60px', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
            <ul className="list-unstyled">
                {/* Main Feeds */}
                <li className="mb-2">
                    <NavLink
                        to="/articles"
                        end
                        className={({ isActive }) =>
                            `d-block px-3 py-2 text-decoration-none small ${isActive && !currentType ? 'fw-bold text-dark border-end border-3 border-orange' : 'text-secondary'}`
                        }
                        style={({ isActive }) => ({
                            backgroundColor: isActive && !currentType ? '#F1F2F3' : 'transparent',
                            borderColor: isActive && !currentType ? 'var(--primary-color)' : 'transparent'
                        })}
                    >
                        🏠 Home
                    </NavLink>
                </li>

                <li className="mb-1 px-3 small text-uppercase text-muted fw-bold mt-3" style={{ fontSize: '0.75rem' }}>
                    Filter By Type
                </li>

                <li className="mb-0">
                    <NavLink
                        to="/articles?type=post"
                        className={`d-flex align-items-center gap-2 px-3 py-2 text-decoration-none small ${currentType === 'post' ? 'fw-bold text-dark bg-light' : 'text-secondary'}`}
                    >
                        📝 Posts
                    </NavLink>
                </li>
                <li className="mb-0">
                    <NavLink
                        to="/articles?type=question"
                        className={`d-flex align-items-center gap-2 px-3 py-2 text-decoration-none small ${currentType === 'question' ? 'fw-bold text-dark bg-light' : 'text-secondary'}`}
                    >
                        ❓ Questions
                    </NavLink>
                </li>
                <li className="mb-0">
                    <NavLink
                        to="/articles?type=poll"
                        className={`d-flex align-items-center gap-2 px-3 py-2 text-decoration-none small ${currentType === 'poll' ? 'fw-bold text-dark bg-light' : 'text-secondary'}`}
                    >
                        📊 Polls
                    </NavLink>
                </li>

                <li className="mb-1 px-3 small text-uppercase text-muted fw-bold mt-3" style={{ fontSize: '0.75rem' }}>
                    Discover
                </li>

                <li>
                    <NavLink to="/tags" className="d-block px-3 py-2 text-decoration-none small text-secondary">
                        🏷️ Tags
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/users" className="d-block px-3 py-2 text-decoration-none small text-secondary">
                        👥 Users
                    </NavLink>
                </li>
            </ul>
        </nav>
    );
}

export default LeftSidebar;
