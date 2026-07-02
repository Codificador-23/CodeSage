import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'
import { Link } from 'react-router-dom'
import { Search, Loader2, ArrowRight, CornerDownRight } from 'lucide-react'
import PageGlow from '../components/PageGlow'

const ExplorerPage = () => {
    const [repos, setRepos] = useState([])
    const [selectedRepo, setSelectedRepo] = useState(null)

    // Chunks data
    const [allChunks, setAllChunks] = useState([])
    const [loadingRepos, setLoadingRepos] = useState(true)
    const [loadingChunks, setLoadingChunks] = useState(false)
    const [page, setPage] = useState(1)

    // Sorting & Filtering
    const [search, setSearch] = useState("")
    const [selectedLang, setSelectedLang] = useState("all")
    const [sortBy, setSortBy] = useState("file_asc")
    const [typeFilters, setTypeFilters] = useState({
        function: true,
        class: true,
        module: true
    })

    // Selected chunk for detail modal
    const [selectedChunk, setSelectedChunk] = useState(null)

    // Load indexed repos on mount
    useEffect(() => {
        const fetchRepos = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/repos`)
                if (res.ok) {
                    const data = await res.json()
                    setRepos(data)
                    if (data.length > 0) {
                        setSelectedRepo(data[0].repo_url)
                    }
                }
            } catch (e) {
                console.error("Error loading repositories:", e)
            } finally {
                setLoadingRepos(false)
            }
        }
        fetchRepos()
    }, [])

    // Load chunks when active repo changes
    useEffect(() => {
        if (!selectedRepo) return
        const fetchChunks = async () => {
            setLoadingChunks(true)
            try {
                const res = await fetch(`${API_BASE_URL}/api/repos/${encodeURIComponent(selectedRepo)}/chunks?paginate=false`)
                if (res.ok) {
                    const data = await res.json()
                    setAllChunks(data.chunks || [])
                    setPage(1)
                }
            } catch (e) {
                console.error("Error fetching repository chunks:", e)
            } finally {
                setLoadingChunks(false)
            }
        }
        fetchChunks()
    }, [selectedRepo])

    // Escape modal exit key listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setSelectedChunk(null)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const formatBreadcrumb = (path) => {
        if (!path) return ""
        return path.replace(/\\/g, '/').split('/').join(' › ')
    }

    const getBadgeClass = (type) => {
        const t = (type || "").toLowerCase()
        if (t.includes('function') || t.includes('method')) return 'badge-function'
        if (t.includes('class')) return 'badge-class'
        return 'badge-module'
    }

    const toggleTypeFilter = (type) => {
        setTypeFilters(prev => ({ ...prev, [type]: !prev[type] }))
        setPage(1)
    }

    // Calculate languages detected in current repo
    const getLanguagesList = () => {
        const current = repos.find(r => r.repo_url === selectedRepo)
        return current?.languages || []
    }

    // Perform local search and type filtering on the loaded page of chunks
    const filteredChunks = allChunks.filter(c => {
        // Language check
        if (selectedLang !== "all" && c.language && c.language.toLowerCase() !== selectedLang.toLowerCase()) {
            return false
        }

        // Chunk type check
        const type = (c.chunk_type || "").toLowerCase()
        if (type.includes('function') || type.includes('method')) {
            if (!typeFilters.function) return false
        } else if (type.includes('class')) {
            if (!typeFilters.class) return false
        } else {
            if (!typeFilters.module) return false
        }

        // Search query check (filepath or snippet keyword)
        if (search.trim()) {
            const q = search.toLowerCase()
            const pathMatch = (c.file_path || "").toLowerCase().includes(q)
            const contentMatch = (c.content || "").toLowerCase().includes(q)
            if (!pathMatch && !contentMatch) return false
        }

        return true
    })

    // Sort the full filtered results
    const sortedChunks = [...filteredChunks].sort((a, b) => {
        if (sortBy === "file_asc") {
            return (a.file_path || "").localeCompare(b.file_path || "")
        }
        if (sortBy === "file_desc") {
            return (b.file_path || "").localeCompare(a.file_path || "")
        }
        if (sortBy === "line_asc") {
            return (a.start_line || 0) - (b.start_line || 0)
        }
        if (sortBy === "chunk_type") {
            return (a.chunk_type || "").localeCompare(b.chunk_type || "")
        }
        return 0
    })

    // Client-side pagination variables
    const pageSize = 15
    const totalPages = Math.ceil(sortedChunks.length / pageSize) || 1
    const paginatedChunks = sortedChunks.slice((page - 1) * pageSize, page * pageSize)

    // Reset page if page overflows totalPages
    useEffect(() => {
        if (page > totalPages) {
            setPage(1)
        }
    }, [sortedChunks.length, totalPages, page])

    if (loadingRepos) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1117', height: '100vh' }}>
                <Loader2 className="animate-spin" size={24} color="#3b82f6" />
            </div>
        )
    }

    if (repos.length === 0) {
        return (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', backgroundColor: '#0d1117', height: '100vh' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>📂</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No Workspace Loaded</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px', maxWidth: '300px', textAlign: 'center' }}>
                    Please index a GitHub repository first to query its abstract chunks.
                </p>
                <Link to="/app" className="btn-primary" style={{ width: 'auto', padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <span>Launch Workspace</span>
                    <ArrowRight size={14} />
                </Link>
            </div>
        )
    }

    const currentRepoMetadata = repos.find(r => r.repo_url === selectedRepo)

    const getFilterStyles = (isActive, type) => {
        let accentColor = 'rgba(59, 130, 246, 0.15)'
        let accentText = '#3b82f6'
        let borderClass = '1px solid #3b82f6'

        if (type === 'class') {
            accentColor = 'rgba(188, 140, 255, 0.15)'
            accentText = 'var(--badge-purple)'
            borderClass = '1px solid var(--badge-purple)'
        } else if (type === 'module') {
            accentColor = 'rgba(240, 136, 62, 0.15)'
            accentText = '#f0883e'
            borderClass = '1px solid #f0883e'
        }

        if (isActive) {
            return {
                background: accentColor,
                color: accentText,
                border: borderClass,
                padding: '8px 14px',
                cursor: 'pointer',
                fontSize: '12px',
                borderRadius: '6px',
                fontWeight: 600,
                outline: 'none',
                transition: 'all 0.15s ease'
            }
        }
        return {
            background: 'var(--surface)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            padding: '8px 14px',
            cursor: 'pointer',
            fontSize: '12px',
            borderRadius: '6px',
            fontWeight: 500,
            outline: 'none',
            transition: 'all 0.15s ease'
        }
    }

    // Run type analysis breakdown counters
    const totalCount = allChunks.length
    let funcCount = 0
    let classCount = 0
    let moduleCount = 0

    allChunks.forEach(c => {
        const type = (c.chunk_type || "").toLowerCase()
        if (type.includes('function') || type.includes('method')) {
            funcCount++
        } else if (type.includes('class')) {
            classCount++
        } else {
            moduleCount++
        }
    })

    const funcPct = totalCount ? (funcCount / totalCount) * 100 : 0
    const classPct = totalCount ? (classCount / totalCount) * 100 : 0
    const modulePct = totalCount ? (moduleCount / totalCount) * 100 : 0

    const totalChunksAcrossAllRepos = repos.reduce((sum, r) => sum + (r.chunk_count || 0), 0)

    return (
        <PageGlow
            colorA="#3b82f6"
            colorB="#2563eb"
            eyebrow="AST Chunk Explorer"
            title="Browse the index"
            subtitle={`${totalChunksAcrossAllRepos} chunks across ${repos.length} workspaces`}
        >
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                backgroundColor: 'transparent',
                marginTop: '10px',
                paddingLeft: '32px',
                paddingRight: '32px',
                marginBottom: '32px'
            }}>
                {/* Left panel repositories listing */}
                <div style={{
                    width: '260px',
                    borderRight: '1px solid var(--border)',
                    padding: '10px 12px 10px 0',
                    flexShrink: 0
                }}>
                    <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '12px', letterSpacing: '0.8px', paddingLeft: '8px' }}>
                        Select Repository
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {repos.map(r => {
                            const isActive = r.repo_url === selectedRepo
                            return (
                                <button
                                    key={r.repo_url}
                                    onClick={() => { setSelectedRepo(r.repo_url); setPage(1); }}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        background: isActive ? 'var(--surface)' : 'transparent',
                                        border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        color: isActive ? 'var(--text)' : 'var(--text-muted)',
                                        fontSize: '13px',
                                        transition: 'all 150ms ease'
                                    }}
                                >
                                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {r.repo_name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        {r.chunk_count} Chunks
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Right panel chunks listing grid */}
                <div style={{
                    flex: 1,
                    padding: '10px 0 10px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    {/* Selected Repository Title Header */}
                    {currentRepoMetadata && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid var(--border)',
                            paddingBottom: '14px',
                            marginBottom: '-4px'
                        }}>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '2px', letterSpacing: '0.5px' }}>
                                    Active Repository
                                </span>
                                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                                    {currentRepoMetadata.repo_name}
                                </h2>
                            </div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px 8px' }}>
                                {currentRepoMetadata.repo_url}
                            </span>
                        </div>
                    )}

                    {/* Aggregate statistics */}
                    {currentRepoMetadata && (
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            padding: '14px 18px',
                            alignItems: 'center'
                        }}>
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Total Chunks</span>
                                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{allChunks.length}</span>
                            </div>
                            <div style={{ width: '1px', alignSelf: 'stretch', backgroundColor: 'var(--border)' }} />
                            <div>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Languages</span>
                                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                                    {getLanguagesList().map(lang => (
                                        <span key={lang} style={{ fontSize: '11px', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: '10px', color: 'var(--text)' }}>
                                            {lang}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AST Breakdown Chart (Feature 6) */}
                    {totalCount > 0 && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            padding: '16px 18px',
                            marginTop: '-8px'
                        }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                                AST Node Type Breakdown
                            </span>
                            <div style={{ display: 'flex', gap: '24px', width: '100%', flexWrap: 'wrap' }}>
                                {/* Functions */}
                                <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ fontWeight: 650, color: 'var(--badge-blue)' }}>Functions</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{funcCount} ({funcPct.toFixed(1)}%)</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${funcPct}%`, height: '100%', background: '#58a6ff', borderRadius: '4px' }} />
                                    </div>
                                </div>
                                {/* Classes */}
                                <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ fontWeight: 650, color: 'var(--badge-purple)' }}>Classes</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{classCount} ({classPct.toFixed(1)}%)</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${classPct}%`, height: '100%', background: '#bc8cff', borderRadius: '4px' }} />
                                    </div>
                                </div>
                                {/* Modules */}
                                <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                        <span style={{ fontWeight: 650, color: '#f0883e' }}>Modules</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{moduleCount} ({modulePct.toFixed(1)}%)</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${modulePct}%`, height: '100%', background: '#f0883e', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filter controls header */}
                    <div style={{
                        display: 'flex',
                        gap: '14px',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {/* Keyword Search */}
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                            <input
                                type="text"
                                placeholder="Search file path or token keyword..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="text-input-field"
                                style={{ paddingLeft: '36px' }}
                            />
                            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '15px' }} />
                        </div>

                        {/* Sort dropdown */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sort:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                                className="text-input-field"
                                style={{ width: '160px', cursor: 'pointer' }}
                            >
                                <option value="file_asc">File Path (A-Z)</option>
                                <option value="file_desc">File Path (Z-A)</option>
                                <option value="line_asc">Line Number (Asc)</option>
                                <option value="chunk_type">Chunk Type</option>
                            </select>
                        </div>

                        {/* Lang filter */}
                        <select
                            value={selectedLang}
                            onChange={(e) => { setSelectedLang(e.target.value); setPage(1); }}
                            className="text-input-field"
                            style={{ width: '140px', cursor: 'pointer' }}
                        >
                            <option value="all">All Languages</option>
                            {getLanguagesList().map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>

                        {/* Toggle buttons by Chunk Type */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => toggleTypeFilter('function')}
                                style={getFilterStyles(typeFilters.function, 'function')}
                            >
                                Function
                            </button>
                            <button
                                onClick={() => toggleTypeFilter('class')}
                                style={getFilterStyles(typeFilters.class, 'class')}
                            >
                                Class
                            </button>
                            <button
                                onClick={() => toggleTypeFilter('module')}
                                style={getFilterStyles(typeFilters.module, 'module')}
                            >
                                Module
                            </button>
                        </div>
                    </div>

                    {/* Chunks data table */}
                    {loadingChunks ? (
                        <div style={{ display: 'flex', padding: '60px 0', alignItems: 'center', justifyContent: 'center' }}>
                            <Loader2 className="animate-spin" size={24} color="#3b82f6" />
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {paginatedChunks.length === 0 ? (
                                <div style={{ border: '1px dashed var(--border)', borderRadius: '6px', padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                    No chunks matched the current filters.
                                </div>
                            ) : (
                                paginatedChunks.map((chunk, idx) => {
                                    const globalIdx = (page - 1) * pageSize + idx
                                    return (
                                        <div
                                            key={globalIdx}
                                            onClick={() => setSelectedChunk(chunk)}
                                            style={{
                                                background: 'var(--surface)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                transition: 'border-color 0.15s ease',
                                                overflow: 'hidden'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6' }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
                                        >
                                            <div
                                                style={{
                                                    padding: '12px 16px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    userSelect: 'none'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                                                    <span className={`source-badge ${getBadgeClass(chunk.chunk_type)}`} style={{ flexShrink: 0 }}>
                                                        {chunk.chunk_type || 'code'}
                                                    </span>
                                                    <span
                                                        style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                        title={chunk.file_path}
                                                    >
                                                        {formatBreadcrumb(chunk.file_path)}
                                                    </span>
                                                    {chunk.start_line && chunk.end_line && (
                                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                                                            Lines {chunk.start_line}-{chunk.end_line}
                                                        </span>
                                                    )}
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>
                                                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                                                        {chunk.language}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 500 }}>
                                                        View Details
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{
                                                padding: '0 16px 12px 16px',
                                                fontSize: '12px',
                                                color: 'var(--text-muted)',
                                                fontFamily: 'var(--font-mono)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                <CornerDownRight size={10} style={{ flexShrink: 0 }} />
                                                <span>{chunk.content.substring(0, 100)}...</span>
                                            </div>
                                        </div>
                                    )
                                })
                            )}

                            {/* Pagination controls at the bottom */}
                            {sortedChunks.length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                                    <button
                                        disabled={page <= 1}
                                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                        className="btn-primary"
                                        style={{ width: 'auto', padding: '6px 12px', fontSize: '13px', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}
                                    >
                                        ← Previous
                                    </button>
                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 550 }}>
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        disabled={page >= totalPages}
                                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                                        className="btn-primary"
                                        style={{ width: 'auto', padding: '6px 12px', fontSize: '13px', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Chunk Detail Modal Overlay */}
            {selectedChunk && (
                <div
                    onClick={() => setSelectedChunk(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '40px'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            width: '100%',
                            maxWidth: '800px',
                            maxHeight: '80vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        {/* Modal Header */}
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden', marginRight: '16px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                    {selectedChunk.chunk_type || 'code_chunk'}
                                </span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={selectedChunk.file_path}>
                                    {selectedChunk.file_path} {selectedChunk.start_line && selectedChunk.end_line ? `(Lines ${selectedChunk.start_line}-${selectedChunk.end_line})` : ''}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedChunk(null)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    outline: 'none',
                                    transition: 'background-color 0.15s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div style={{
                            flex: 1,
                            overflow: 'auto',
                            padding: '20px',
                            backgroundColor: '#070a0e'
                        }}>
                            <pre style={{
                                margin: 0,
                                padding: '16px',
                                backgroundColor: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                overflowX: 'auto',
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '12px',
                                color: 'var(--text)',
                                lineHeight: '1.5'
                            }}>
                                <code>{selectedChunk.content}</code>
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </PageGlow>
    )
}

export default ExplorerPage
