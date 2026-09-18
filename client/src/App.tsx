// Route table: sign-in and shared links are public; everything else needs a signed-in user.
import { Navigate, Outlet, Route, Routes } from 'react-router';
import { AppHeader } from '@/components/AppHeader';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { CollectionPage } from '@/pages/CollectionPage';
import { CollectionsPage } from '@/pages/CollectionsPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SearchPage } from '@/pages/SearchPage';
import { SharedCollectionPage } from '@/pages/SharedCollectionPage';

function Layout() {
  return (
    <div className="min-h-dvh bg-paper">
      <AppHeader />
      <main className="pb-16">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="s/:token" element={<SharedCollectionPage />} />
        <Route element={<RequireAuth />}>
          <Route index element={<Navigate to="/search" replace />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="collections/:id" element={<CollectionPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
