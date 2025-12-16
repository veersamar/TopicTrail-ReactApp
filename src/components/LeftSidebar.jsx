import React from 'react';
import { NavLink } from 'react-router-dom';

function LeftSidebar() {
    const navItems = [
        { label: 'Home', path: '/articles', exact: true },
        { label: 'Questions', path: '/questions', icon: 'bi-globe' }, // Using Questions as a proxy for main feed if needed, or redirect
        { label: 'Tags', path: '/tags' },
        { label: 'Users', path: '/users' },
    ];

    return (
        <nav className="left-sidebar pt-4 sticky-top" style={{ top: '60px', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
            <ul className="list-unstyled">
                <li className="mb-2">
                    <NavLink
                        to="/articles"
                        end
                        className={({ isActive }) =>
                            `d-block px-3 py-2 text-decoration-none small ${isActive ? 'fw-bold text-dark border-end border-3 border-orange' : 'text-secondary'}`
                        }
                        style={({ isActive }) => ({
                            backgroundColor: isActive ? '#F1F2F3' : 'transparent',
                            borderColor: isActive ? 'var(--primary-color)' : 'transparent'
                        })}
                    >
                        Home
                    </NavLink>
                </li>

                <li className="mb-1 px-3 small text-uppercase text-muted fw-bold mt-3" style={{ fontSize: '0.75rem' }}>
                    Public
                </li>

                <li className="mb-0">
                    <NavLink
                        to="/articles" // For now, mapping Questions to Articles as well, or we can make a distinction
                        className={({ isActive }) =>
                            `d-flex align-items-center gap-2 px-3 py-2 text-decoration-none small ${isActive ? 'fw-bold text-dark bg-light' : 'text-secondary'}`
                        }
                    >
                        <i className="bi bi-globe"></i>
                        <span>Questions</span>
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/tags" className="d-block px-3 py-2 text-decoration-none small text-secondary ps-5">
                        Tags
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/users" className="d-block px-3 py-2 text-decoration-none small text-secondary ps-5">
                        Users
                    </NavLink>
                </li>
            </ul>
        </nav>
    );
}

export default LeftSidebar;
