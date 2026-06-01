import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Growth from './pages/Growth';
import Photos from './pages/Photos';
import Milestones from './pages/Milestones';
import Diaper from './pages/Diaper';
import Settings from './pages/Settings';

export default function App() {
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
