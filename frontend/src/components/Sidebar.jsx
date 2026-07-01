import React from 'react'
import { Folder, Plus, MessageSquarePlus } from 'lucide-react'

const Sidebar = ({ repos, activeRepo, onSelectRepo, onAddRepo, onNewChat }) => {
    const getRepoName = (url) => {
        if (!url) return ""
        try {
            const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url
            const parts = cleanUrl.split('/')
            if (parts.length > 0) {
                return parts[parts.length - 1]
            }
            return url
        } catch (e) {
            return url
        }
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                <div className="sidebar-heading">WORKSPACES</div>
                {activeRepo && (
                    <div style={{ padding: '0 12px' }}>
                        <button
                            onClick={onNewChat}
                            disabled={!activeRepo}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: '1px dashed var(--border)',
                                color: 'var(--text-muted)',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                cursor: activeRepo ? 'pointer' : 'not-allowed',
                                fontSize: '12px',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                opacity: activeRepo ? 1 : 0.5,
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <MessageSquarePlus size={14} />
                            <span>New Chat</span>
                        </button>
                    </div>
                )}
                <ul className="repo-list">
                    {repos.map((repoUrl) => {
                        const isActive = repoUrl === activeRepo
                        return (
                            <li key={repoUrl}>
                                <button
                                    className={`repo-item ${isActive ? 'active' : ''}`}
                                    onClick={() => onSelectRepo(repoUrl)}
                                    title={repoUrl}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', padding: '10px 12px' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                        {isActive && (
                                            <span className="pulse-dot" style={{
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                backgroundColor: '#2ea44f',
                                                display: 'inline-block',
                                                flexShrink: 0
                                            }} />
                                        )}
                                        <span
                                            className={isActive ? 'active-repo-badge' : ''}
                                            style={{
                                                fontSize: '13px',
                                                fontWeight: isActive ? 600 : 500,
                                                color: isActive ? 'var(--text)' : 'var(--text-muted)',
                                                maxWidth: '180px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {getRepoName(repoUrl)}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '11px', color: '#2ea44f', paddingLeft: isActive ? '14px' : '0px', fontWeight: 500 }}>
                                        ready
                                    </span>
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </div>

            <div className="sidebar-footer">
                <button className="nav-btn" onClick={onAddRepo}>
                    <Plus size={14} />
                    <span>New Repository</span>
                </button>
            </div>
        </aside>
    )
}

export default Sidebar
