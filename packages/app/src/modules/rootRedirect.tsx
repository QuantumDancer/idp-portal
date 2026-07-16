import { PageBlueprint } from '@backstage/frontend-plugin-api';
import { Navigate } from 'react-router-dom';

// Redirects the app root to the catalog, replacing the legacy
// `<Route path="/" element={<Navigate to="catalog" />} />`. No title/icon is
// set so it does not surface as a sidebar nav item.
export const rootRedirectPage = PageBlueprint.make({
  name: 'root-redirect',
  params: {
    path: '/',
    noHeader: true,
    loader: async () => <Navigate to="/catalog" />,
  },
});
