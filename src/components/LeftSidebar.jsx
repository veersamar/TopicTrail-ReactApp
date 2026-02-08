import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function LeftSidebar() {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const currentType = query.get('type');
    const isArticlesPage = location.pathname === '/articles';

    const navItems = [
        { path: '/articles', label: 'Home', isActive: isArticlesPage && !currentType },
    ];

    const filterItems = [
        { path: '/articles?type=post', label: 'Posts', isActive: isArticlesPage && currentType === 'post' },
        { path: '/articles?type=question', label: 'Questions', isActive: isArticlesPage && currentType === 'question' },
        { path: '/polls', label: 'Polls', isActive: location.pathname === '/polls' },
    ];

    const discoverItems = [
        { path: '/communities', label: 'Communities', isActive: location.pathname.startsWith('/communities') },
        { path: '/tags', label: 'Tags', isActive: location.pathname === '/tags' },
        { path: '/users', label: 'Users', isActive: location.pathname === '/users' },
    ];

    const NavLink = ({ path, label, isActive }) => (
        <li>
            <Link
                to={path}
                className={`sidebar-nav-link ${isActive ? 'sidebar-nav-link--active' : ''}`}
            >
                {label}
            </Link>
        </li>
    );

    return (
        <nav className="sidebar-nav">
            <ul className="stack stack--xs">
                {navItems.map(item => (
                    <NavLink key={item.path} {...item} />
                ))}
            </ul>

            <div className="sidebar-section">
                <h4 className="heading-small mb-2">Filter By Type</h4>
                <ul className="stack stack--xs">
                    {filterItems.map(item => (
                        <NavLink key={item.path} {...item} />
                    ))}
                </ul>
            </div>

            <div className="sidebar-section">
                <h4 className="heading-small mb-2">Discover</h4>
                <ul className="stack stack--xs">
                    {discoverItems.map(item => (
                        <NavLink key={item.path} {...item} />
                    ))}
                </ul>
            </div>
        </nav>
    );
}

export default LeftSidebar;
