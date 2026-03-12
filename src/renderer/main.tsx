import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import '@xyflow/react/dist/style.css';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
