import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { I18nProvider } from './i18n';
import { AuthProvider } from './store';
import { initTheme } from './themeManager';
import './theme.css';

// ใช้ธีมที่ cache ไว้ก่อน render แรก (กันสีกะพริบ) — ค่าจริง sync จาก backend ใน Layout
initTheme();

// BrowserRouter + basename = URL จริง (/company ไม่ใช่ /#/company) → SEO/AEO ได้ทุกหน้า
// basename มาจาก import.meta.env.BASE_URL: VPS='/', GitHub Pages='/eimaths-bounty-hunter/copper8000/'
// deep-link/refresh: VPS ใช้ nginx try_files, GitHub Pages ใช้ไฟล์ index.html ต่อ route (ดู deploy.yml)
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <I18nProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
