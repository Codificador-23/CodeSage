import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Search, MessageSquare, ArrowRight } from 'lucide-react'
import PageGlow from '../components/PageGlow'

const groupByDate = (messages) => {
    const groups = {}
    messages.forEach(msg => {
        const date = msg.timestamp ? new Date(msg.timestamp) : new Date()
        const dateKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        if (!groups[dateKey]) groups[dateKey] = []
        groups[dateKey].push(msg)
    })
    return groups
}

const getDateLabel = (dateKey) => {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    if (dateKey === today) return 'Today'
    if (dateKey === yesterday) return 'Yesterday'
    return dateKey
}

const HistoryPage = () => {
    const { chatArchive, clearArchivedChat, setActiveRepo, setShowFullInput } = useApp()
    const navigate = useNavigate()
    const [search, setSearch] = useState("")

    // Expanded states for repository message blocks
    const [expandedRepos, setExpandedRepos] = useState(new Set())

    const getRepoName = (url) => {
        if (!url) return ""
        try {
            const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url
            const parts = cleanUrl.split('/')
            return parts[parts.length - 1] || url
        } catch (e) {
            return url
        }
    }

    const toggleExpandRepo = (repoUrl) => {
        setExpandedRepos(prev => {
            const next = new Set(prev)
            if (next.has(repoUrl)) {
                next.delete(repoUrl)
            } else {
                next.add(repoUrl)
            }
            return next
        })
    }

    const handleFollowUp = (repoUrl) => {
        setActiveRepo(repoUrl)
        setShowFullInput(false)
        navigate('/app')
    }

    const handleExport = (group) => {
        const dateStr = new Date().toLocaleDateString()
        let markdown = `# CodeSage Conversation — ${group.repoName}\n`
        markdown += `Exported: ${dateStr}\n\n`

        let userMsg = ""
        group.messages.forEach(msg => {
            if (msg.role === 'user') {
                userMsg = msg.content
            } else if (msg.role === 'assistant') {
                markdown += `## Q: ${userMsg}\n`
                markdown += `${msg.content || ""}\n`
                if (msg.sources && msg.sources.length > 0) {
                    markdown += `Sources: ` + msg.sources.map(src => {
                        const filePath = src.filepath || src.file_path || ""
                        const linesStr = src.start_line && src.end_line ? ` L${src.start_line}-${src.end_line}` : ''
                        return `${filePath}${linesStr}`
                    }).join(', ') + `\n`
                }
                markdown += `---\n\n`
                userMsg = "" // Reset
            }
        })

        const blob = new Blob([markdown], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const dateFileStr = dateStr.replace(/\//g, '-')
        a.download = `codesage-${group.repoName}-${dateFileStr}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // Map histories to grouped items
    const groups = Object.entries(chatArchive || {})
        .map(([repoUrl, messages]) => {
            return {
                repoUrl,
                repoName: getRepoName(repoUrl),
                messages: messages || []
            }
        })
        .filter(g => g.messages.length > 0)

    // Apply search query criteria to the entire conversation contents
    const filteredGroups = groups.filter(g => {
        if (!search.trim()) return true
        const query = search.toLowerCase()
        return g.messages.some(m => (m.content || "").toLowerCase().includes(query))
    })

    const hasHistory = groups.length > 0

    return (
        <PageGlow
            colorA="#eab308"
            colorB="#ca8a04"
            eyebrow="Chat History"
            title="Your conversations"
            subtitle="Review previous repository discussions"
        >
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                minHeight: 'calc(100vh - 120px)',
                paddingTop: '10px'
            }}>
                {!hasHistory ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '60px 20px',
                        border: '1px dashed var(--border)',
                        borderRadius: '6px',
                        textAlign: 'center',
                        marginTop: '20px'
                    }}>
                        <MessageSquare size={32} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No Conversations Found</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px', maxWidth: '320px' }}>
                            Your active repository discussions and search logs will show up here.
                        </p>
                        <Link to="/app" className="btn-primary" style={{ width: 'auto', padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                            <span>Start Chatting</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Keyword Filter input */}
                        <div style={{ position: 'relative', width: '100%' }}>
                            <input
                                type="text"
                                placeholder="Search message content keywords..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="text-input-field"
                                style={{ paddingLeft: '38px' }}
                            />
                            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '15px' }} />
                        </div>

                        {filteredGroups.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px', fontSize: '13px' }}>
                                No conversation history matches the enter filter term.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
                                {filteredGroups.map((group) => {
                                    const isExpanded = expandedRepos.has(group.repoUrl)
                                    return (
                                        <div
                                            key={group.repoUrl}
                                            style={{
                                                background: 'var(--surface)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                transition: 'border-color 0.15s ease'
                                            }}
                                            className="history-repo-card"
                                        >
                                            {/* Repository Clickable Banner */}
                                            <div
                                                onClick={() => toggleExpandRepo(group.repoUrl)}
                                                style={{
                                                    padding: '16px 20px',
                                                    backgroundColor: 'rgba(234, 179, 8, 0.02)',
                                                    borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    cursor: 'pointer',
                                                    userSelect: 'none'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '16px' }}>📦</span>
                                                    <span style={{ fontWeight: 600, fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                                                        {group.repoName}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '12px' }}>
                                                        {group.messages.length} messages
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleExport(group)
                                                        }}
                                                        className="btn-primary"
                                                        style={{
                                                            width: 'auto',
                                                            padding: '4px 10px',
                                                            fontSize: '11px',
                                                            backgroundColor: 'transparent',
                                                            border: '1px solid var(--border)'
                                                        }}
                                                    >
                                                        Export as Markdown
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleFollowUp(group.repoUrl)
                                                        }}
                                                        className="btn-primary"
                                                        style={{
                                                            width: 'auto',
                                                            padding: '4px 10px',
                                                            fontSize: '11px',
                                                            backgroundColor: 'transparent',
                                                            border: '1px solid var(--border)'
                                                        }}
                                                    >
                                                        Continue Conversation
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (window.confirm('Delete all history for this repository? This cannot be undone.')) {
                                                                clearArchivedChat(group.repoUrl)
                                                            }
                                                        }}
                                                        className="btn-primary"
                                                        style={{
                                                            width: 'auto',
                                                            padding: '4px 10px',
                                                            fontSize: '11px',
                                                            backgroundColor: 'transparent',
                                                            border: '1px solid var(--border)',
                                                            color: '#ff4d4d'
                                                        }}
                                                    >
                                                        Clear Chat
                                                    </button>
                                                    <span style={{ color: '#eab308', fontSize: '12px', fontWeight: 500, marginLeft: '4px' }}>
                                                        {isExpanded ? 'Collapse' : 'Expand thread'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Message thread details */}
                                            {isExpanded && (
                                                <div style={{
                                                    padding: '20px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '18px',
                                                    backgroundColor: '#070a0e'
                                                }}>
                                                    {(() => {
                                                        const grouped = groupByDate(group.messages)
                                                        return Object.entries(grouped).map(([dateKey, msgs]) => {
                                                            const dateLabel = getDateLabel(dateKey)
                                                            return (
                                                                <React.Fragment key={dateKey}>
                                                                    {/* Date Separator */}
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '12px 0' }}>
                                                                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                                                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{dateLabel}</span>
                                                                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                                                                    </div>
                                                                    
                                                                    {/* Messages for this date */}
                                                                    {msgs.map((msg, index) => {
                                                                        const isUser = msg.role === 'user'
                                                                        return (
                                                                            <div
                                                                                key={index}
                                                                                style={{
                                                                                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                                                                                    maxWidth: '85%',
                                                                                    display: 'flex',
                                                                                    flexDirection: 'column',
                                                                                    gap: '6px'
                                                                                }}
                                                                            >
                                                                                <div style={{
                                                                                    fontSize: '11px',
                                                                                    color: 'var(--text-muted)',
                                                                                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                                                                                    fontFamily: 'var(--font-mono)',
                                                                                    display: 'flex',
                                                                                    gap: '6px',
                                                                                    marginBottom: '2px'
                                                                                }}>
                                                                                    <span>{isUser ? 'User' : 'Assistant'}</span>
                                                                                    {msg.timestamp && (
                                                                                        <>
                                                                                            <span>•</span>
                                                                                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                                <div style={{
                                                                                    backgroundColor: 'var(--surface)',
                                                                                    border: '1px solid var(--border)',
                                                                                    borderLeft: isUser ? '1px solid var(--border)' : '2px solid #eab308',
                                                                                    borderRadius: '6px',
                                                                                    padding: '12px 16px',
                                                                                    fontSize: '13px',
                                                                                    color: 'var(--text)',
                                                                                    whiteSpace: 'pre-wrap',
                                                                                    lineHeight: '1.5',
                                                                                    width: '100%'
                                                                                }}>
                                                                                    {msg.content || (msg.loading ? "Generating response..." : "Empty content")}

                                                                                    {/* Traced dynamic code contexts */}
                                                                                    {!isUser && msg.sources && msg.sources.length > 0 && (
                                                                                        <div style={{
                                                                                            marginTop: '12px',
                                                                                            paddingTop: '8px',
                                                                                            borderTop: '1px solid var(--border)',
                                                                                            fontSize: '11px',
                                                                                            color: 'var(--text-muted)'
                                                                                        }}>
                                                                                            <div style={{ fontWeight: 650, marginBottom: '4px' }}>Traced contexts:</div>
                                                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                                                {msg.sources.map((src, sidx) => (
                                                                                                    <span key={sidx} style={{ fontFamily: 'var(--font-mono)', color: '#eab308' }}>
                                                                                                        ↳ {src.filepath || src.file_path} {src.start_line && src.end_line ? `(Lines ${src.start_line}-${src.end_line})` : ''}
                                                                                                    </span>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </React.Fragment>
                                                            )
                                                        })
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </PageGlow>
    )
}

export default HistoryPage
