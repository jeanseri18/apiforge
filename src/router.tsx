import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Collections } from './pages/Collections';
import { Environments } from './pages/Environments';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { DatabaseBrowser } from './pages/DatabaseBrowser';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'collections',
        element: <Collections />
      },
      {
        path: 'collections/:id',
        element: <Collections />
      },
      {
        path: 'environments',
        element: <Environments />
      },
      {
        path: 'history',
        element: <History />
      },
      {
        path: 'database',
        element: <DatabaseBrowser />
      },
      {
        path: 'settings',
        element: <Settings />
      },
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ]
  }
]);

export default router;