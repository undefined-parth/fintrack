import { createBrowserRouter } from 'react-router';
import App from './App.tsx';
import { RouterProvider } from 'react-router/dom';
import { lazy } from 'react';

const AddNewUser = lazy(() => import('@/pages/AddNewUser.tsx'));
const UserCreatedSuccess = lazy(() => import('@/pages/UserCreatedSuccess.tsx'));

const router = createBrowserRouter([
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
  {
    path: '/dashboard',
    element: <div>Dashboard</div>,
  },
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;
