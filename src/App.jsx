import { Routes, Route } from 'react-router-dom';
import { usePin } from './utils/PinContext';
import Layout from './components/Layout';
import PinGuard from './components/PinGuard';
import Dashboard from './pages/Dashboard';
import Growth from './pages/Growth';
import Photos from './pages/Photos';
import Milestones from './pages/Milestones';
import Diaper from './pages/Diaper';
import Settings from './pages/Settings';

export default function App() {
  const { isAuthenticated } = usePin();

  if (!isAuthenticated) {
    return <PinGuard />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/growth" element={<Growth />} />
        <Route path="/photos" element={<Photos />} />
        <Route path="/milestones" element={<Milestones />} />
        <Route path="/diaper" element={<Diaper />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
