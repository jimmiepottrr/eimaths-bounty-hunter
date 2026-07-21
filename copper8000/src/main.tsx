import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { I18nProvider } from './i18n';
import { AuthProvider } from './store';
import './theme.css';

// HashRouter: อยู่ใต้ subpath ของ GitHub Pages — กัน 404 ตอน refresh/deep-link
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <I18nProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </I18nProvider>
    </HashRouter>
  </React.StrictMode>,
);
