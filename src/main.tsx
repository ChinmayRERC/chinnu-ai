import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/App';
import {AgentProvider} from './agent/AgentProvider';
import './ui/styles.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><AgentProvider><App/></AgentProvider></React.StrictMode>);
