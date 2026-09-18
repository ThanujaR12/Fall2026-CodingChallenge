// Route table: sign-in and shared links are public; everything else needs a signed-in user.
import { Outlet, Route, Routes } from 'react-router';
import { AppHeader } from '@/components/AppHeader';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { useAuth } from '@/features/auth/useAuth';
import { MobileNav } from '@/features/navigation/MobileNav';
import { Sidebar } from '@/features/navigation/Sidebar';
import { SidebarProvider } from '@/features/navigation/SidebarProvider';
import { ChatCircleDots, PlusSquare } from '@phosphor-icons/react';
import { ComingSoonPage } from '@/pages/ComingSoonPage';
import { ExplorePage } from '@/pages/ExplorePage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { CollectionPage } from '@/pages/CollectionPage';
import { CollectionsPage } from '@/pages/CollectionsPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PalettesPage } from '@/pages/PalettesPage';
import { SearchPage } from '@/pages/SearchPage';
import { SharedCollectionPage } from '@/pages/SharedCollectionPage';

function Layout() {
  const { status } = useAuth();
  const signedIn = status === 'signedIn';

  return (
    <SidebarProvider>
      <div className="min-h-dvh bg-paper">
        {signedIn && <Sidebar />}
        <AppHeader />
        <main className={signedIn ? 'pb-24 md:pb-16' : 'pb-16'}>
          <Outlet />
        </main>
        {signedIn && <MobileNav />}
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="s/:token" element={<SharedCollectionPage />} />
        {/* Explore and public boards are open to everyone, signed in or not. */}
        <Route path="explore" element={<ExplorePage />} />
        <Route path="explore/:id" element={<SharedCollectionPage source="public" />} />
        <Route element={<RequireAuth />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="collections/:id" element={<CollectionPage />} />
          <Route path="palettes" element={<PalettesPage />} />
          {/* Sidebar destinations still to be built. */}
          <Route
            path="create"
            element={
              <ComingSoonPage
                title="Create"
                icon={PlusSquare}
                body="Start a new board or add photos from here."
              />
            }
          />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route
            path="messages"
            element={
              <ComingSoonPage
                title="Chat"
                icon={ChatCircleDots}
                body="Talk about boards with the people you build them with."
              />
            }
          />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
