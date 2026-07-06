import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'
import { useApp } from '../context/AppContext'
import { Trash2, AlertOctagon, Loader2, Copy, RefreshCw, Check } from 'lucide-react'
import PageGlow from '../components/PageGlow'

const SettingsPage = () => {
    const { deleteRepo, clearAllData, statsVersion } = useApp()
    const [reposMetadata, setReposMetadata] = useState([])
    const [stats, setStats] = useState(null)
    const [chunkBreakdowns, setChunkBreakdowns] = useState({}) // repoUrl -> breakdown

    const [loading, setLoading] = useState(true)
    const [deletingRepoUrl, setDeletingRepoUrl] = useState(null)
    const [reindexingRepoUrl, setReindexingRepoUrl] = useState(null)
    const [reindexProgress, setReindexProgress] = useState(0)
    const [copiedRepoUrl, setCopiedRepoUrl] = useState(null)
    const [clearingAll, setClearingAll] = useState(false)
    const [errorStr, setErrorStr] = useState(null)

    // Trigger state to force re-fetch
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    useEffect(() => {
        setLoading(true)
        Promise.all([
            fetch(`${API_BASE_URL}/api/repos`).then(r => {
                if (!r.ok) throw new Error("Failed fetching repository metadata.")
                return r.json()
            }),
            fetch(`${API_BASE_URL}/api/stats`).then(r => {
                if (!r.ok) throw new Error("Failed fetching database statistics.")
                return r.json()
            })
        ]).then(([reposData, statsData]) => {
            setReposMetadata(reposData)
            setStats(statsData)
            setLoading(false)

            // Fetch chunk breakdown in background
            const fetchBreakdowns = async () => {
                const breakdowns = {}
                for (const repo of reposData) {
                    try {
                        const res = await fetch(`${API_BASE_URL}/api/repos/${encodeURIComponent(repo.repo_url)}/chunks?paginate=false`)
                        if (res.ok) {
                            const data = await res.json()
                            const chunks = data.chunks || []
                            let func = 0, cls = 0, mod = 0
                            chunks.forEach(c => {
                                const type = (c.chunk_type || "").toLowerCase()
                                if (type.includes('function') || type.includes('method')) {
                                    func++
                                } else if (type.includes('class')) {
                                    cls++
                                } else {
                                    mod++
                                }
                            })
                            breakdowns[repo.repo_url] = { func, cls, mod, total: chunks.length }
                        }
                    } catch (e) {
                        console.warn("Failed fetching breakdown for", repo.repo_url, e)
                    }
                }
                setChunkBreakdowns(breakdowns)
            }
            fetchBreakdowns()

        }).catch(err => {
            setErrorStr(err.message)
            setLoading(false)
        })
    }, [refreshTrigger, statsVersion])

    const handleDelete = async (url) => {
        if (!window.confirm("Purging this workspace will remove all code token indices from Qdrant and PostgreSQL metadata database logs. Are you sure?")) {
            return
        }

        setDeletingRepoUrl(url)
        try {
            const success = await deleteRepo(url)
            if (success) {
                setReposMetadata(prev => prev.filter(r => r.repo_url !== url))
                // Re-fetch stats to sync vector count
                const statsRes = await fetch(`${API_BASE_URL}/api/stats`)
                if (statsRes.ok) {
                    const statsData = await statsRes.json()
                    setStats(statsData)
                }
            } else {
                alert("Failed to delete repository from backend.")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setDeletingRepoUrl(null)
        }
    }

    const handleReindex = async (repoUrl) => {
        setReindexingRepoUrl(repoUrl)
        setReindexProgress(0)
        try {
            // 1. DELETE
            const delRes = await fetch(`${API_BASE_URL}/api/repos/${encodeURIComponent(repoUrl)}`, {
                method: 'DELETE'
            })
            if (!delRes.ok) {
                throw new Error("Failed to clear previous repository collection index.")
            }

            // 2. INGEST POST
            const ingestRes = await fetch(`${API_BASE_URL}/api/ingest/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ repo_url: repoUrl })
            })
            if (!ingestRes.ok) {
                throw new Error("Request to trigger workspace re-indexing failed.")
            }

            // 3. POLL
            let elapsed = 0
            const interval = setInterval(async () => {
                elapsed += 3
                setReindexProgress(elapsed)
                if (elapsed >= 15) {
                    clearInterval(interval)
                    setReindexingRepoUrl(null)
                    // Refresh data using refresh trigger
                    setRefreshTrigger(prev => prev + 1)
                }
            }, 3000)

        } catch (e) {
            alert(e.message)
            setReindexingRepoUrl(null)
        }
    }

    const handleCopyUrl = (url) => {
        try {
            navigator.clipboard.writeText(url)
            setCopiedRepoUrl(url)
            setTimeout(() => {
                setCopiedRepoUrl(null)
            }, 2000)
        } catch (e) {
            console.error(e)
        }
    }

    const handleClearAll = async () => {
        if (!window.confirm("WARNING: Danger Zone! This operation will drop PostgreSQL codebase metadata and truncate the active Qdrant vector space. Continue?")) {
            return
        }

        setClearingAll(true)
        try {
            const success = await clearAllData()
            if (success) {
                setReposMetadata([])
                setStats({ total_vectors: 0, collection_name: 'code_sage' })
            } else {
                alert("Could not clear workspaces data.")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setClearingAll(false)
        }
    }

    const getRelativeTime = (isoString) => {
        if (!isoString) return 'N/A'
        try {
            const normalizedString = isoString.endsWith('Z') || isoString.includes('+')
                ? isoString
                : isoString + 'Z'
            const date = new Date(normalizedString)
            const now = new Date()
            const diffMs = now - date
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
            if (diffDays <= 0) {
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                if (diffHours <= 0) {
                    const diffMins = Math.floor(diffMs / (1000 * 60))
                    if (diffMins <= 0) {
                        return 'Just now'
                    }
                    return `${diffMins} mins ago`
                }
                return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
            }
            if (diffDays === 1) return 'Yesterday'
            return `${diffDays} days ago`
        } catch {
            return 'N/A'
        }
    }

    const renderBreakdownBar = (repoUrl) => {
        const rawBreakdown = chunkBreakdowns[repoUrl]
        if (!rawBreakdown || rawBreakdown.total === 0) {
            return (
                <div style={{ height: '5px', backgroundColor: 'var(--border)', borderRadius: '2px', width: '100%', marginTop: '10px' }} />
            )
        }
        const { func, cls, mod, total } = rawBreakdown
        const funcPct = Math.round((func / total) * 100) || 0
        const clsPct = Math.round((cls / total) * 100) || 0
        const modPct = 100 - funcPct - clsPct

        return (
            <div style={{ marginTop: '10px', width: '100%' }}>
                <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', backgroundColor: 'var(--border)' }}>
                    {func > 0 && <div style={{ width: `${funcPct}%`, backgroundColor: '#f97316' }} title={`Functions: ${funcPct}%`} />}
                    {cls > 0 && <div style={{ width: `${clsPct}%`, backgroundColor: '#fb923c' }} title={`Classes: ${clsPct}%`} />}
                    {mod > 0 && <div style={{ width: `${modPct}%`, backgroundColor: '#fdba74' }} title={`Modules: ${modPct}%`} />}
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f97316' }} />
                        Functions: {func} ({funcPct}%)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fb923c' }} />
                        Classes: {cls} ({clsPct}%)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fdba74' }} />
                        Modules: {mod} ({modPct}%)
                    </span>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1117', height: '100vh' }}>
                <Loader2 className="animate-spin" size={24} color="#f97316" />
            </div>
        )
    }

    return (
        <PageGlow
            colorA="#f97316"
            colorB="#ea580c"
            eyebrow="Settings"
            title="Manage workspaces"
            subtitle="Coordinate active index environments and vector logs"
        >
            <div style={{
                paddingTop: '10px',
                paddingBottom: '40px',
                paddingLeft: '32px',
                paddingRight: '32px'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {errorStr && (
                        <div style={{
                            backgroundColor: 'rgba(248, 81, 73, 0.1)',
                            border: '1px solid #f85149',
                            padding: '12px 16px',
                            borderRadius: '6px',
                            color: '#f85149',
                            fontSize: '13px'
                        }}>
                            {errorStr}
                        </div>
                    )}

                    {/* Section: Qdrant Database Statistics */}
                    <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <h3 style={{ fontSize: '15.5px', fontWeight: 650, color: '#fff', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                            Analytics & Database
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '16px'
                        }}>
                            <div style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '18px'
                            }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Qdrant Collection</span>
                                <span style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: '#f97316', marginTop: '4px', display: 'block' }}>
                                    {stats?.collection_name || "code_sage"}
                                </span>
                            </div>
                            <div style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '18px'
                            }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Total Vector Embeddings</span>
                                <span style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', display: 'block' }}>
                                    {stats?.total_vectors ?? 0}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Section: Repository Metadata Management */}
                    <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <h3 style={{ fontSize: '15.5px', fontWeight: 650, color: '#fff', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                            Indexed Workspaces ({reposMetadata.length})
                        </h3>

                        {reposMetadata.length === 0 ? (
                            <div style={{ border: '1px dashed var(--border)', borderRadius: '6px', padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                No repositories indexed yet.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {reposMetadata.map((repo) => (
                                    <div
                                        key={repo.repo_url}
                                        style={{
                                            background: 'var(--surface)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '8px',
                                            padding: '20px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden', marginRight: '16px' }}>
                                                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
                                                    {repo.repo_name}
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={repo.repo_url}>
                                                    {repo.repo_url}
                                                </div>
                                            </div>

                                            {/* Action buttons */}
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {/* Copy URL Trigger */}
                                                <button
                                                    onClick={() => handleCopyUrl(repo.repo_url)}
                                                    className="btn-primary"
                                                    style={{
                                                        width: 'auto',
                                                        padding: '8px 12px',
                                                        background: 'transparent',
                                                        fontSize: '12px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    {copiedRepoUrl === repo.repo_url ? (
                                                        <>
                                                            <Check size={12} color="#2ea44f" />
                                                            <span style={{ color: '#2ea44f' }}>Copied!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy size={12} />
                                                            <span>Copy URL</span>
                                                        </>
                                                    )}
                                                </button>

                                                {/* Reindex Button */}
                                                <button
                                                    disabled={reindexingRepoUrl === repo.repo_url || deletingRepoUrl === repo.repo_url}
                                                    onClick={() => handleReindex(repo.repo_url)}
                                                    className="btn-primary"
                                                    style={{
                                                        width: 'auto',
                                                        padding: '8px 12px',
                                                        background: 'transparent',
                                                        fontSize: '12px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    {reindexingRepoUrl === repo.repo_url ? (
                                                        <>
                                                            <Loader2 className="animate-spin" size={12} />
                                                            <span>Indexing ({reindexProgress}s)...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RefreshCw size={12} />
                                                            <span>Re-index</span>
                                                        </>
                                                    )}
                                                </button>

                                                {/* Delete Button */}
                                                <button
                                                    disabled={deletingRepoUrl === repo.repo_url || reindexingRepoUrl === repo.repo_url}
                                                    onClick={() => handleDelete(repo.repo_url)}
                                                    className="btn-primary"
                                                    style={{
                                                        width: 'auto',
                                                        padding: '8px 12px',
                                                        borderColor: '#f85149',
                                                        color: '#f85149',
                                                        background: 'transparent',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(248, 81, 73, 0.1)' }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                                                >
                                                    {deletingRepoUrl === repo.repo_url ? (
                                                        <Loader2 className="animate-spin" size={12} />
                                                    ) : (
                                                        <>
                                                            <Trash2 size={12} />
                                                            <span>Delete</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Breakdown bar code proportions */}
                                        {renderBreakdownBar(repo.repo_url)}

                                        {/* Metadata Footer */}
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span className="source-badge">
                                                {repo.chunk_count} Chunks
                                            </span>
                                            {repo.languages && repo.languages.map(lang => (
                                                <span key={lang} className="source-badge badge-line">
                                                    {lang}
                                                </span>
                                            ))}
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 550, marginLeft: 'auto' }}>
                                                Last indexed: {getRelativeTime(repo.indexed_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Section: Danger Zone Resets */}
                    <section style={{
                        border: '1px solid #f85149',
                        borderRadius: '8px',
                        padding: '24px',
                        marginTop: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        backgroundColor: 'rgba(248, 81, 73, 0.02)'
                    }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <AlertOctagon size={20} color="#f85149" />
                            <h3 style={{ fontSize: '15px', fontWeight: 650, color: '#f85149' }}>
                                Danger Zone
                            </h3>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4', maxWidth: '500px' }}>
                                Wipe all relational record directories in Postgres database rows and reset the active Qdrant code collection.
                            </div>
                            <button
                                disabled={clearingAll}
                                onClick={handleClearAll}
                                className="btn-primary"
                                style={{
                                    width: 'auto',
                                    padding: '10px 18px',
                                    backgroundColor: '#f85149',
                                    borderColor: '#f85149',
                                    color: '#fff',
                                    flexShrink: 0
                                }}
                            >
                                {clearingAll ? "Resetting database..." : "Clear All Data"}
                            </button>
                        </div>
                    </section>

                </div>
            </div>
        </PageGlow>
    )
}

export default SettingsPage
