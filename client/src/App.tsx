// Route table and shared page layout (header on top, current page below).
import { Navigate, Outlet, Route, Routes } from 'react-router';
import { AppHeader } from '@/components/AppHeader';
import { CollectionPage } from '@/pages/CollectionPage';
import { CollectionsPage } from '@/pages/CollectionsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SearchPage } from '@/pages/SearchPage';

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
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/search" replace />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="collections/:id" element={<CollectionPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
