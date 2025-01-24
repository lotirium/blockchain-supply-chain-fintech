import { createBrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';
import VerificationPending from '../pages/VerificationPending';
// ...other imports...

const router = createBrowserRouter([
  // ...existing routes...
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/verification-pending',
    element: <VerificationPending />,
  },
  // ...other routes...
]);

export default router;
