import React, { useState, useRef, useEffect } from 'react'
import { Send, Terminal } from 'lucide-react'
import { marked } from 'marked'
import ReasoningTrace from './ReasoningTrace'

const ChatWindow = ({ messages, archivedMessages = [], activeRepo, onSendMessage }) => {
    const [input, setInput] = useState("")
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    // Keep track of timestamps for each message locally if not stored on the objects
    const [timestamps, setTimestamps] = useState([])

    useEffect(() => {
        // Generate timestamps for any new messages
        if (messages.length > timestamps.length) {
            const diff = messages.length - timestamps.length
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            const newClocks = Array(diff).fill(now)
            setTimestamps(prev => [...prev, ...newClocks])
        }
    }, [messages, timestamps.length])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Shortcut Cmd/Ctrl + K focus trigger
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault()
                inputRef.current?.focus()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Markdown copy buttons injector
    useEffect(() => {
        const markdownElems = document.querySelectorAll('.markdown-content')
        markdownElems.forEach((container) => {
            const preElems = container.querySelectorAll('pre')
            preElems.forEach((pre) => {
                if (pre.querySelector('.copy-btn')) return

                pre.style.position = 'relative'

                const btn = document.createElement('button')
                btn.className = 'copy-btn'
                btn.type = 'button'
                btn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                `
                btn.style.position = 'absolute'
                btn.style.top = '10px'
                btn.style.right = '10px'
                btn.style.background = 'rgba(27, 31, 36, 0.85)'
                btn.style.border = '1px solid var(--border)'
                btn.style.borderRadius = '4px'
                btn.style.padding = '6px'
                btn.style.cursor = 'pointer'
                btn.style.color = 'var(--text-muted)'
                btn.style.display = 'flex'
                btn.style.alignItems = 'center'
                btn.style.justifyContent = 'center'
                btn.style.zIndex = '10'

                btn.addEventListener('mouseenter', () => {
                    btn.style.color = 'var(--text)'
                    btn.style.borderColor = 'var(--accent)'
                })
                btn.addEventListener('mouseleave', () => {
                    btn.style.color = 'var(--text-muted)'
                    btn.style.borderColor = 'var(--border)'
                })

                btn.addEventListener('click', () => {
                    // Extract code string
                    const code = pre.querySelector('code')?.innerText || pre.innerText
                    navigator.clipboard.writeText(code).then(() => {
                        // Temporary checkmark UI indicator
                        btn.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2ea44f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
                        `
                        setTimeout(() => {
                            btn.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                            `
                        }, 2000)
                    })
                })

                pre.appendChild(btn)
            })
        })
    }, [messages])

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

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!input.trim()) return

        const isAssistantLoading = messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].loading
        if (isAssistantLoading) return

        onSendMessage(input.trim())
        setInput("")
    }

    const handleChipClick = (question) => {
        const isAssistantLoading = messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].loading
        if (isAssistantLoading) return
        onSendMessage(question)
    }

    const getHTML = (content) => {
        try {
            return { __html: marked.parse(content || "") }
        } catch (e) {
            return { __html: content || "" }
        }
    }

    // Filter last 3 unique user questions
    const recentQueries = []
    const seen = new Set()
    for (let i = archivedMessages.length - 1; i >= 0; i--) {
        if (archivedMessages[i].role === 'user') {
            const content = (archivedMessages[i].content || "").trim()
            if (content && !seen.has(content)) {
                seen.add(content)
                recentQueries.push(content)
                if (recentQueries.length === 3) break
            }
        }
    }

    const exampleQuestions = [
        "What does the main function do?",
        "How are models defined?",
        "What are the key dependencies?"
    ]

    const isInputFilled = input.trim().length > 0

    return (
        <div className="chat-container-layout" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>

            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="empty-state-container" style={{ margin: 'auto', textAlign: 'center', maxWidth: '480px', padding: '20px' }}>
                        <div className="empty-state-logo" style={{ fontSize: '40px', marginBottom: '20px' }}>🧙‍♂️</div>
                        <h3 style={{ color: 'var(--text)', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
                            Explore {getRepoName(activeRepo)}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5', marginBottom: '24px' }}>
                            Ask questions to trace code branches, parse structure alignments, or debug class properties. Click an example chip to begin.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {exampleQuestions.map((q, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className="example-chip-btn"
                                    onClick={() => handleChipClick(q)}
                                    style={{
                                        backgroundColor: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '6px',
                                        color: 'var(--text)',
                                        padding: '10px 14px',
                                        fontSize: '13px',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        fontWeight: 500
                                    }}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="message-list-root" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {messages.map((msg, index) => {
                            const isUser = msg.role === 'user'
                            const isLastMsg = index === messages.length - 1
                            const timeString = timestamps[index] || ""

                            return (
                                <div key={index} className={`message-item-container ${isUser ? 'user-aligned' : 'assistant-aligned'}`} style={{
                                    display: 'flex',
                                    gap: '12px',
                                    flexDirection: 'row',
                                    maxWidth: isUser ? '85%' : '100%',
                                    width: isUser ? 'auto' : '100%',
                                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                                    marginBottom: '12px'
                                }}>
                                    {/* Assistant Avatar */}
                                    {!isUser && (
                                        <div className="avatar-circle assistant-avatar" style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: 'rgba(88, 166, 255, 0.1)',
                                            border: '1px solid var(--accent)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--accent)',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            flexShrink: 0,
                                            alignSelf: 'flex-start',
                                            marginTop: '4px'
                                        }}>
                                            CS
                                        </div>
                                    )}

                                    <div className="message-content-wrapper" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                        <div className="message-meta-header" style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '11px',
                                            color: 'var(--text-muted)',
                                            marginBottom: '6px',
                                            justifyContent: isUser ? 'flex-end' : 'flex-start'
                                        }}>
                                            <span style={{ fontWeight: 600, color: isUser ? 'var(--text)' : 'var(--accent)' }}>
                                                {isUser ? 'You' : 'CodeSage'}
                                            </span>
                                            <span>•</span>
                                            <span>{timeString}</span>
                                        </div>

                                        <div className="message-bubble">
                                            {isUser ? (
                                                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                                            ) : (
                                                <>
                                                    {msg.loading && !msg.content ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                                            <span>Analyzing chunks...</span>
                                                            <span className="blinking-cursor">|</span>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <div
                                                                className="markdown-content"
                                                                dangerouslySetInnerHTML={getHTML(msg.content)}
                                                            />
                                                            {msg.loading && isLastMsg && (
                                                                <span className="blinking-cursor" style={{ alignSelf: 'flex-start', marginTop: '4px' }}>|</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {!msg.loading && (
                                                        <ReasoningTrace sources={msg.sources} />
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* User Avatar */}
                                    {isUser && (
                                        <div className="avatar-circle user-avatar" style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--border)',
                                            border: '1px solid var(--border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--text-muted)',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            flexShrink: 0,
                                            alignSelf: 'flex-start',
                                            marginTop: '4px'
                                        }}>
                                            You
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <form onSubmit={handleSubmit} className="chat-input-form">
                    <input
                        ref={inputRef}
                        type="text"
                        className="chat-text-input"
                        placeholder={`Ask a question... (Ctrl+K to focus)`}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].loading}
                    />
                    <button
                        type="submit"
                        className={`chat-send-btn ${isInputFilled ? 'has-text' : ''}`}
                        disabled={!input.trim() || (messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].loading)}
                    >
                        <Send size={16} />
                    </button>
                </form>

                {/* Recent queries suggestion */}
                {!input.trim() && recentQueries.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px 0 8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Recent:</span>
                        {recentQueries.map((q, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setInput(q)}
                                style={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text)',
                                    borderRadius: '12px',
                                    padding: '2px 8px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
                            >
                                {q.length > 40 ? `${q.substring(0, 40)}...` : q}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ChatWindow
