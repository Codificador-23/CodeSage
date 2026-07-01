import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import LandingPage from './pages/LandingPage.jsx'
import AppPage from './pages/AppPage.jsx'
import ExplorerPage from './pages/ExplorerPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import ComparePage from './pages/ComparePage.jsx'
import DocsPage from './pages/DocsPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import './App.css'

const MainLayout = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/explore" element={<ExplorerPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
            </Routes>
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AppProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/app" element={<AppPage />} />
                    <Route path="/*" element={<MainLayout />} />
                </Routes>
            </BrowserRouter>
        </AppProvider>
    </React.StrictMode>
)