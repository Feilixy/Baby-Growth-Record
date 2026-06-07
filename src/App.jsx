import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { usePin } from './utils/PinContext';
import Layout from './components/Layout';
import PinGuard from './components/PinGuard';

// 代码分割：每个页面独立加载，首屏只下载当前页面的代码
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Growth = lazy(() => import('./pages/Growth'));
const Photos = lazy(() => import('./pages/Photos'));
const Milestones = lazy(() => import('./pages/Milestones'));
const Diary = lazy(() => import('./pages/Diary'));
const Settings = lazy(() => import('./pages/Settings'));

function PageLoading() {
  return (
    <div className="loading-screen fade-in">
      <div className="loading-spinner" />
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = usePin();

  if (!isAuthenticated) {
    return <PinGuard />;
  }

  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/growth" element={<Growth />} />
          <Route path="/photos" element={<Photos />} />
          <Route path="/milestones" element={<Milestones />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
