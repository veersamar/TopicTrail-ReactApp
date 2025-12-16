import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navigation';
import LeftSidebar from './LeftSidebar';
import TrendingSidebar from './TrendingSidebar';
import CreateArticleModal from './CreateArticleModal';

function MainLayout() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    // We can treat refreshTrigger as a context or just let ArticleFeed handle its own fetching.
    // For now, if we create an article, we might want to refresh the feed. 
    // But since the Feed is inside Outlet, passing props is tricky without context.
    // We'll rely on the modal's onSuccess to trigger a re-fetch if we can, or just let the user pull to refresh/nav.
    // Actually, ArticleFeed is the main consumer. We can use a simple context or event, but for this redesign, 
    // let's just refresh the whole window or use a context if needed.
    // Simpler: Just pass a key to Outlet? No, Outlet doesn't take props easily.
    // We'll leave the refresh logic for a moment and focus on layout.

    const handleCreateSuccess = () => {
        // Ideally trigger refresh. For now we can reload window or use a global context.
        window.location.reload();
    };

    return (
        <div className="d-flex flex-column min-vh-100 bg-body">
            <Navbar onCreateClick={() => setShowCreateModal(true)} />

            <div className="container-lg my-0 flex-grow-1">
                <div className="d-flex justify-content-between pt-4">
                    {/* Left Sidebar */}
                    <aside className="d-none d-md-block pe-3 border-end" style={{ width: 'var(--sidebar-width)', flexShrink: 0 }}>
                        <LeftSidebar />
                    </aside>

                    {/* Main Content */}
                    <main className="flex-grow-1 px-md-4" style={{ minWidth: 0 }}>
                        <Outlet />
                    </main>

                    {/* Right Sidebar */}
                    <aside className="d-none d-lg-block ps-3" style={{ width: 'var(--rightbar-width)', flexShrink: 0 }}>
                        <TrendingSidebar />
                    </aside>
                </div>
            </div>

            {/* Create Article Modal */}
            <CreateArticleModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateSuccess}
            />
        </div>
    );
}

export default MainLayout;
