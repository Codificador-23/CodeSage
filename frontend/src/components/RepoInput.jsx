import React, { useState, useEffect } from 'react'
import { FolderGit2, AlertTriangle, Github } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

const RepoInput = ({ onIngest, isIngesting, status, error, isFullScreen, progress, alreadyIndexed, pendingRepoUrl }) => {
    const { handleSelectRepo, proceedIngestion, setAlreadyIndexed } = useApp()
    const navigate = useNavigate()
    const [url, setUrl] = useState("")
    const [localError, setLocalError] = useState(null)

    const handleSubmit = (e) => {
        e.preventDefault()
        setLocalError(null)

        const cleanUrl = url.trim()
        if (!cleanUrl) {
            setLocalError("URL cannot be empty.")
            return
        }

        if (!cleanUrl.startsWith("https://github.com/")) {
            setLocalError("Invalid URL. Must start with https://github.com/")
            return
        }

        onIngest(cleanUrl)
    }

    const activeError = localError || error

    return (
        <div className={`repo-input-wrapper ${isFullScreen ? 'fullscreen' : ''}`}>
            {!isFullScreen && (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.4' }}>
                    Index a public repository to launch your workspace.
                </p>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="repo-url" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Github size={12} color="var(--text-muted)" />
                        <span>Repository URL</span>
                    </label>
                    <div className="input-with-icon-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                            id="repo-url"
                            type="text"
                            className="text-input-field"
                            placeholder="https://github.com/user/repo"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={isIngesting || alreadyIndexed}
                            required
                            style={{ paddingLeft: '36px' }}
                        />
                        <div style={{ position: 'absolute', left: '12px', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                            <Github size={16} color="var(--text-muted)" />
                        </div>
                    </div>
                </div>

                <button type="submit" className="btn-primary" disabled={isIngesting || alreadyIndexed || !url.trim()}>
                    {isIngesting ? (
                        <>
                            <span className="animate-spin">⚙️</span>
                            {status || "Indexing codebase..."}
                        </>
                    ) : (
                        <>
                            <FolderGit2 size={16} />
                            <span>Index Repository</span>
                        </>
                    )}
                </button>
            </form>

            {/* Already Indexed detection UI */}
            {alreadyIndexed && (
                <div className="already-indexed-block border-orange" style={{
                    backgroundColor: 'rgba(240, 136, 62, 0.08)',
                    border: '1px solid #f0883e',
                    padding: '16px',
                    borderRadius: '8px',
                    marginTop: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <span style={{ fontSize: '13px', color: '#fff', fontWeight: 550 }}>
                        This repository is already indexed.
                    </span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            className="btn-primary"
                            style={{ width: 'auto', padding: '8px 14px', fontSize: '13px' }}
                            onClick={() => {
                                handleSelectRepo(pendingRepoUrl)
                                setAlreadyIndexed(false)
                                navigate('/app')
                            }}
                        >
                            Switch to it
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            style={{
                                width: 'auto',
                                padding: '8px 14px',
                                fontSize: '13px',
                                background: 'transparent',
                                border: '1px solid var(--border)'
                            }}
                            onClick={() => {
                                proceedIngestion(pendingRepoUrl)
                            }}
                        >
                            Re-index
                        </button>
                    </div>
                </div>
            )}

            {isIngesting && (
                <div className="progress-bar-container" style={{
                    width: '100%',
                    height: '4px',
                    backgroundColor: 'var(--border)',
                    borderRadius: '2px',
                    marginTop: '16px',
                    overflow: 'hidden'
                }}>
                    <div className="progress-bar-fill" style={{
                        width: `${progress}%`,
                        height: '100%',
                        backgroundColor: 'var(--accent)',
                        borderRadius: '2px',
                        transition: 'width 0.2s ease-out'
                    }} />
                </div>
            )}

            {isIngesting && status && (
                <div className="ingestion-status-block fade-in-status">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                        <span>Status Trace ({Math.round(progress)}%)</span>
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>{status}</div>
                </div>
            )}

            {activeError && (
                <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f85149', marginTop: '12px' }}>
                    <AlertTriangle size={14} />
                    <span>{activeError}</span>
                </div>
            )}
        </div>
    )
}

export default RepoInput
