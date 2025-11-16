import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import ArticlesFeed from '../components/ArticlesFeed';
import CreateArticleModal from '../components/CreateArticleModal';
import UserProfile from '../components/UserProfile';

function Dashboard() {
  const [currentPage, setCurrentPage] = useState('feed');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleArticleCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setShowCreateModal(false);
  };

  return (
    <div>
      <Navigation onNewArticle={() => setShowCreateModal(true)} />
      
      <main>
        {currentPage === 'feed' && (
          <ArticlesFeed refreshTrigger={refreshTrigger} />
        )}
        {currentPage === 'profile' && (
          <UserProfile />
        )}
      </main>

      <CreateArticleModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleArticleCreated}
      />
    </div>
  );
}

export default Dashboard;
