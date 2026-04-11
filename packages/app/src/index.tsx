import '@backstage/cli/asset-types';
import ReactDOM from 'react-dom/client';
import app from './App';
import '@backstage/ui/css/styles.css';

// app is a React element (not a component) in the new frontend system
ReactDOM.createRoot(document.getElementById('root')!).render(app);
