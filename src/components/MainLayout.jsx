import React from 'react';
import { Outlet, useNavigate, useLocation, matchPath } from 'react-router-dom';
import Navbar from './Navigation';
import LeftSidebar from './LeftSidebar';
import TrendingSidebar from './TrendingSidebar';

function MainLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we are on the Article Detail page
    // We want to hide sidebars ONLY for the view page, not feed or create
    const isArticleView = matchPath('/articles/:id', location.pathname);

    // Focus Mode state (controlled by children, e.g., CreateArticlePage)
    const [isFocusMode, setIsFocusMode] = React.useState(false);

    const handleCreateClick = (type) => {
        navigate(`/create-article?type=${type || 'post'}`);
    };

    return (
        <div className="d-flex flex-column min-vh-100 bg-body">
            <Navbar onCreateClick={handleCreateClick} />

            <div className={`container-lg my-0 flex-grow-1 ${isArticleView || isFocusMode ? 'px-0' : ''}`}>
                <div className="d-flex justify-content-between pt-4">
                    {/* Left Sidebar - Hide on Article View OR Focus Mode */}
                    {!isArticleView && !isFocusMode && (
                        <aside className="d-none d-md-block pe-3 border-end" style={{ width: 'var(--sidebar-width)', flexShrink: 0 }}>
                            <LeftSidebar />
                        </aside>
                    )}

                    {/* Main Content */}
                    <main className="flex-grow-1 px-md-4" style={{ minWidth: 0 }}>
                        <Outlet context={{ setIsFocusMode, isFocusMode }} />
                    </main>

                    {/* Right Sidebar - Hide on Article View OR Focus Mode */}
                    {!isArticleView && !isFocusMode && (
                        <aside className="d-none d-lg-block ps-3" style={{ width: 'var(--rightbar-width)', flexShrink: 0 }}>
                            <TrendingSidebar />
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MainLayout;
