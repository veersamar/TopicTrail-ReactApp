import React from 'react';
import { Outlet, useNavigate, useLocation, matchPath } from 'react-router-dom';
import Navbar from './Navigation';
import LeftSidebar from './LeftSidebar';
import TrendingSidebar from './TrendingSidebar';
import { AppShell, PageContainer, ContentLayout } from './layout';

function MainLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    // Check page types for layout decisions
    const isArticleView = matchPath('/articles/:id', location.pathname);
    const isPollView = matchPath('/poll/:id', location.pathname);
    const isProfileView = matchPath('/profile', location.pathname);
    const isCommunityDetail = matchPath('/communities/:slug', location.pathname) && 
                               !matchPath('/communities/create', location.pathname);

    // Focus Mode state (controlled by children, e.g., CreateArticlePage)
    const [isFocusMode, setIsFocusMode] = React.useState(false);

    // Determine if we should show sidebars
    // Hide sidebars for detail/view pages and focus mode (create/edit)
    const isDetailView = isArticleView || isPollView || isProfileView || isCommunityDetail;
    const hideSidebars = isDetailView || isFocusMode;

    // Determine container size:
    // - Detail views (article, poll, profile, community): 'lg' (1024px) - centered with room for content
    // - Focus mode (create/edit): '2xl' (1536px) - wide for forms with two-column layout
    // - Normal with sidebars: '2xl' (uses full width, sidebars handle spacing)
    const getContainerSize = () => {
        if (isDetailView) return 'lg';
        if (isFocusMode) return '2xl';
        return '2xl';
    };

    const handleCreateClick = (type) => {
        if (type === 'question') {
            navigate('/create-question');
        } else if (type === 'poll') {
            navigate('/create-poll');
        } else {
            navigate(`/create-article?type=${type || 'post'}`);
        }
    };

    return (
        <AppShell header={<Navbar onCreateClick={handleCreateClick} />}>
            <PageContainer size={getContainerSize()}>
                <ContentLayout
                    sidebar={!hideSidebars && <LeftSidebar />}
                    aside={!hideSidebars && <TrendingSidebar />}
                    hideSidebars={hideSidebars}
                >
                    <Outlet context={{ setIsFocusMode, isFocusMode }} />
                </ContentLayout>
            </PageContainer>
        </AppShell>
    );
}

export default MainLayout;
