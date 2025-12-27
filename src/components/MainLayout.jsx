import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navigation';
import LeftSidebar from './LeftSidebar';
import TrendingSidebar from './TrendingSidebar';
import CreateArticleModal from './CreateArticleModal';

function MainLayout() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedArticleType, setSelectedArticleType] = useState('post');

    const handleCreateClick = (type) => {
        setSelectedArticleType(type || 'post');
        setShowCreateModal(true);
    };

    const handleCloseModal = () => {
        setShowCreateModal(false);
        setSelectedArticleType('post');
    };

    const handleCreateSuccess = () => {
        window.location.reload();
    };

    return (
        <div className="d-flex flex-column min-vh-100 bg-body">
            <Navbar onCreateClick={handleCreateClick} />

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
                onClose={handleCloseModal}
                onSuccess={handleCreateSuccess}
                articleType={selectedArticleType}
            />
        </div>
    );
}

export default MainLayout;
