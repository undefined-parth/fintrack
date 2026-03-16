import { createBrowserRouter } from 'react-router';
import App from './App.tsx';
import { RouterProvider } from 'react-router/dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/add-user',
    element: <div>Add User</div>,
  },
  {
    path: '/dashboard',
    element: <div>Dashboard</div>,
  },
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;
