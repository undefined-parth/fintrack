import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { lazy, Suspense } from 'react';
import AppLayout from '@/layouts/AppLayout';
import App from './App.tsx';

const AddNewUser = lazy(() => import('@/pages/AddNewUser'));
const UserCreatedSuccess = lazy(() => import('@/pages/UserCreatedSuccess'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Transactions = lazy(() => import('@/pages/Transactions'));
const Loans = lazy(() => import('@/pages/Loans'));

const router = createBrowserRouter([
  // Auth / onboarding
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/add-user',
    element: <AddNewUser />,
  },
  {
    path: '/user-created',
    element: <UserCreatedSuccess />,
  },

  // App pages
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/transactions', element: <Transactions /> },
      { path: '/loans', element: <Loans /> },
    ],
  },
]);

const AppRouter = () => (
  <Suspense fallback={null}>
    <RouterProvider router={router} />
  </Suspense>
);

export default AppRouter;
