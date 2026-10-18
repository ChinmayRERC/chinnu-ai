import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/App';
import {AgentProvider} from './agent/AgentProvider';
import LaunchScreen from './ui/LaunchScreen';
import './ui/styles.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><LaunchScreen><AgentProvider><App/></AgentProvider></LaunchScreen></React.StrictMode>);
