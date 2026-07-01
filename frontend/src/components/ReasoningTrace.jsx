import React, { useState } from 'react'
import { ChevronDown, ChevronRight, File } from 'lucide-react'

const ReasoningTrace = ({ sources }) => {
    const [isOpen, setIsOpen] = useState(false)

    if (!sources || sources.length === 0) return null

    const uniqueFilesCount = new Set(sources.map(s => s.file_path)).size

    const formatPathBreadcrumb = (path) => {
        if (!path) return ""
        // Standardize slashes and replace with character arrows
        return path.replace(/\\/g, '/').split('/').join(' › ')
    }

    const getBadgeClass = (type) => {
        const t = (type || "").toLowerCase()
        if (t.includes('function') || t.includes('method')) {
            return 'badge-function'
        }
        if (t.includes('class')) {
            return 'badge-class'
        }
        return 'badge-module'
    }

    return (
        <div className="sources-section">
            <button
                type="button"
                className="sources-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>Sources ({uniqueFilesCount} {uniqueFilesCount === 1 ? 'file' : 'files'})</span>
            </button>

            {isOpen && (
                <div className="sources-container">
                    {sources.map((source, index) => (
                        <div key={index} className="source-card">
                            <div className="source-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                    <File size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                                    <span className="source-filepath" title={source.file_path}>
                                        {formatPathBreadcrumb(source.file_path)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                    {source.chunk_type && (
                                        <span className={`source-badge ${getBadgeClass(source.chunk_type)}`}>
                                            {source.chunk_type}
                                        </span>
                                    )}
                                    {source.start_line && source.end_line && (
                                        <span className="source-badge badge-line">
                                            L{source.start_line}-{source.end_line}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <pre className="source-content-pre">
                                <code className="source-content-code">
                                    {source.content.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '').replace(/`/g, '')}
                                </code>
                            </pre>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ReasoningTrace
