import React, { useState, useEffect } from 'react'
import { CheckCircle, AlertTriangle, Play, Loader2 } from 'lucide-react'
import PageGlow from '../components/PageGlow'

const DocsPage = () => {
    const [systemStatus, setSystemStatus] = useState({
        status: 'checking', // 'online', 'offline', 'checking'
        responseTime: null,
        vectorCount: null
    })
    const [pinging, setPinging] = useState(false)
    const [pingResult, setPingResult] = useState(null)

    // Check status on mount
    useEffect(() => {
        const checkSystem = async () => {
            const startTime = performance.now()
            try {
                const [healthRes, statsRes] = await Promise.all([
                    fetch('/api/health'),
                    fetch('/api/stats')
                ])
                const endTime = performance.now()
                const timeTaken = Math.round(endTime - startTime)

                let status = 'offline'
                if (healthRes.ok) {
                    const healthData = await healthRes.json()
                    if (healthData.status === 'healthy') {
                        status = 'online'
                    }
                }

                let vectorCount = 0
                if (statsRes.ok) {
                    const statsData = await statsRes.json()
                    vectorCount = statsData.total_vectors || 0
                }

                setSystemStatus({
                    status,
                    responseTime: timeTaken,
                    vectorCount
                })
            } catch (e) {
                setSystemStatus({
                    status: 'offline',
                    responseTime: null,
                    vectorCount: null
                })
            }
        }
        checkSystem()
    }, [])

    const handlePingTest = async () => {
        setPinging(true)
        const startTime = performance.now()
        try {
            const res = await fetch('/api/health')
            const duration = Math.round(performance.now() - startTime)
            if (res.ok) {
                const data = await res.json()
                setPingResult({
                    status: res.status,
                    time: `${duration}ms`,
                    body: data
                })
            } else {
                setPingResult({
                    status: res.status,
                    time: `${duration}ms`,
                    body: { error: res.statusText }
                })
            }
        } catch (e) {
            setPingResult({
                status: 'Failed',
                time: 'N/A',
                body: { error: e.message }
            })
        } finally {
            setPinging(false)
        }
    }

    const scrollToSection = (id) => {
        const el = document.getElementById(id)
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' })
        }
    }

    const architectureSteps = [
        { name: 'Git Clone', color: '#d8b4fe', desc: 'Shallow cloner limits workspace payload size.' },
        { name: 'Tree-sitter Parse', color: '#c084fc', desc: 'Splits source code into AST class/function code blocks.' },
        { name: 'all-MiniLM-L6-v2', color: '#a855f7', desc: 'Generates dense vector embeddings using SentenceTransformers.' },
        { name: 'Qdrant Hybrid Search', color: '#9333ea', desc: 'Executes BM25 sparse + Dense search on vector index.' },
        { name: 'Cross-Encoder Rerank', color: '#7c3aed', desc: 'Reranks raw candidates to extract top 5 relevant snippets.' },
        { name: 'Groq LLM Engine', color: '#6d28d9', desc: 'Streams completed response via LangGraph generators.' }
    ]

    const endpoints = [
        {
            method: 'POST',
            path: '/api/ingest/',
            body: `{\n  "repo_url": "https://github.com/user/project"\n}`,
            response: `{\n  "status": "ingesting",\n  "detail": "Workspace background indexing has begun."\n}`
        },
        {
            method: 'POST',
            path: '/api/chat/',
            body: `{\n  "repo_url": "https://github.com/user/project",\n  "message": "Explain get_status() in postgres.py",\n  "history": []\n}`,
            response: `{\n  "answer": "The get_status() method checks PostgreSQL engine availability...",\n  "sources": [\n    {\n      "file_path": "backend/app/db/postgres.py",\n      "start_line": 34,\n      "end_line": 42,\n      "chunk_type": "function",\n      "content": "async def get_status(conn)..."\n    }\n  ]\n}`
        },
        {
            method: 'POST',
            path: '/api/chat/stream',
            body: `{\n  "repo_url": "https://github.com/user/project",\n  "message": "Trace data ingestion stream workflow",\n  "history": []\n}`,
            response: `[Server-Sent Events Payload Stream]\ndata: {"type": "context", "data": [{"file_path": "cloner.py", ...}]}\ndata: {"type": "token", "data": "To"}\ndata: {"type": "token", "data": " trace"}\ndata: {"type": "done"}`
        }
    ]

    return (
        <PageGlow
            colorA="#a855f7"
            colorB="#9333ea"
            eyebrow="Documentation"
            title="How CodeSage works"
            subtitle="Architecture, tech stack, and API reference"
        >
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                backgroundColor: 'transparent',
                marginTop: '10px',
                paddingLeft: '32px',
                paddingRight: '32px',
                marginBottom: '40px'
            }}>
                {/* Sticky Left Sidebar Navigation */}
                <div style={{
                    width: '220px',
                    borderRight: '1px solid var(--border)',
                    padding: '10px 16px 10px 0',
                    flexShrink: 0
                }}>
                    <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 650, marginBottom: '20px', letterSpacing: '0.8px' }}>
                        Sections
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button onClick={() => scrollToSection('system-status')} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, outline: 'none' }}>
                            ① System Status
                        </button>
                        <button onClick={() => scrollToSection('architecture')} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, outline: 'none' }}>
                            ② Architecture
                        </button>
                        <button onClick={() => scrollToSection('tech-stack')} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, outline: 'none' }}>
                            ③ Tech Stack
                        </button>
                        <button onClick={() => scrollToSection('api-reference')} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, outline: 'none' }}>
                            ④ API Reference
                        </button>
                    </div>
                </div>

                {/* Docs Content Grid */}
                <div style={{
                    flex: 1,
                    padding: '10px 0 40px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '48px'
                }}>
                    {/* Section ① System Status */}
                    <section id="system-status" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: '#fff' }}>① System Status</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {systemStatus.status === 'checking' && <Loader2 className="animate-spin" size={20} color="var(--text-muted)" />}
                                {systemStatus.status === 'online' && <CheckCircle size={20} color="#2ea44f" />}
                                {systemStatus.status === 'offline' && <AlertTriangle size={20} color="#f85149" />}
                                <div>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Backend Service</span>
                                    <span style={{ fontSize: '15px', fontWeight: 600, color: systemStatus.status === 'online' ? '#2ea44f' : systemStatus.status === 'offline' ? '#f85149' : 'var(--text)' }}>
                                        {systemStatus.status === 'online' ? 'Online' : systemStatus.status === 'offline' ? 'Offline' : 'Checking...'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: systemStatus.responseTime ? '#2ea44f' : 'var(--text-muted)' }} />
                                <div>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Response Latency</span>
                                    <span style={{ fontSize: '15px', fontWeight: 650, fontFamily: 'var(--font-mono)' }}>
                                        {systemStatus.responseTime !== null ? `${systemStatus.responseTime}ms` : '--'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a855f7' }} />
                                <div>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Vector Size</span>
                                    <span style={{ fontSize: '15px', fontWeight: 650, fontFamily: 'var(--font-mono)' }}>
                                        {systemStatus.vectorCount !== null ? `${systemStatus.vectorCount} embeddings` : '--'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section ② Architecture */}
                    <section id="architecture">
                        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: '#fff' }}>② Architecture</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>
                            CodeSage runs an AST-based indexing and retrieval pipeline. Codebases are shallow cloned and parsed into functional components before vector storage layout retrieval.
                        </p>

                        {/* Visual CSS-based Pipeline Flowchart */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '24px'
                        }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Retrieval Graph Flow</h4>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '12px'
                            }}>
                                {architectureSteps.map((step, idx) => (
                                    <React.Fragment key={idx}>
                                        <div style={{
                                            flex: '1',
                                            minWidth: '120px',
                                            border: '1px solid var(--border)',
                                            borderRadius: '6px',
                                            padding: '12px',
                                            textAlign: 'center',
                                            backgroundColor: 'var(--bg)'
                                        }}>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: step.color, display: 'block', marginBottom: '4px' }}>
                                                {step.name}
                                            </span>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', lineHeight: '1.3' }}>
                                                {step.desc}
                                            </span>
                                        </div>
                                        {idx < architectureSteps.length - 1 && (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '18px', fontWeight: 'bold', flexShrink: 0 }}>
                                                →
                                            </span>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Section ③ Tech Stack */}
                    <section id="tech-stack">
                        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: '#fff' }}>③ Tech Stack</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '18px', lineHeight: '1.5' }}>
                            We leverage a custom architecture to prioritize low-latency execution and high accuracy semantic code retrieval.
                        </p>

                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '13px',
                            textAlign: 'left'
                        }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '12px 10px', color: 'var(--text-muted)', fontWeight: 600 }}>Layer</th>
                                    <th style={{ padding: '12px 10px', color: 'var(--text-muted)', fontWeight: 600 }}>Technology</th>
                                    <th style={{ padding: '12px 10px', color: 'var(--text-muted)', fontWeight: 600 }}>Utility</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { l: 'API Server', t: 'FastAPI', u: 'Drives low latency async routes and server SSE responses.' },
                                    { l: 'AST Tokenizer', t: 'Tree-sitter', u: 'Extracts exact boundaries and metadata of code declarations.' },
                                    { l: 'Embedding Model', t: 'sentence-transformers', u: 'Computes multi-dimensional vectors for query mapping (all-MiniLM-L6-v2).' },
                                    { l: 'Vector Space', t: 'Qdrant Collection', u: 'Supports hybrid dense/sparse BM25 evaluations.' },
                                    { l: 'Reranking Engine', t: 'Cross-Encoder', u: 'Scores vector output nodes to guarantee contextual relevance.' },
                                    { l: 'Chat LLM Coordinator', t: 'LangGraph + Groq', u: 'Orchestrates states and queries LLMs for streaming tokens.' },
                                    { l: 'Metadata Store', t: 'PostgreSQL (asyncpg)', u: 'Stores index records, language flags, and cloner paths.' }
                                ].map((stack, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'var(--surface)' }}>
                                        <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{stack.l}</td>
                                        <td style={{ padding: '12px 10px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{stack.t}</td>
                                        <td style={{ padding: '12px 10px', color: 'var(--text)' }}>{stack.u}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    {/* Section ④ API Reference */}
                    <section id="api-reference">
                        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', color: '#fff' }}>④ API Reference & Tester</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px', lineHeight: '1.5' }}>
                            Reference schemas for integrations. Use the sandbox tool below to test service endpoints.
                        </p>

                        {/* Interactive Tester */}
                        <div style={{
                            background: 'var(--surface)',
                            border: '1px dashed var(--accent)',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '32px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div>
                                    <span style={{ fontWeight: 650, fontSize: '14px', display: 'block' }}>Endpoints Tester Sandbox</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ping GET /api/health to inspect raw backend headers</span>
                                </div>
                                <button
                                    onClick={handlePingTest}
                                    disabled={pinging}
                                    className="btn-primary"
                                    style={{
                                        width: 'auto',
                                        padding: '8px 14px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '12px'
                                    }}
                                >
                                    {pinging ? (
                                        <>
                                            <Loader2 className="animate-spin" size={12} />
                                            <span>Pinging...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play size={12} fill="currentColor" />
                                            <span>Ping Backend</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {pingResult && (
                                <div style={{
                                    marginTop: '14px',
                                    background: 'var(--bg)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    padding: '12px'
                                }}>
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
                                        <span>Status: <strong style={{ color: pingResult.status === 200 ? '#2ea44f' : '#f85149' }}>{pingResult.status}</strong></span>
                                        <span>Time: <strong>{pingResult.time}</strong></span>
                                    </div>
                                    <pre style={{ margin: 0, overflowX: 'auto' }}>
                                        <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)' }}>
                                            {JSON.stringify(pingResult.body, null, 2)}
                                        </code>
                                    </pre>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {endpoints.map((ep, idx) => (
                                <div key={idx} style={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    padding: '20px'
                                }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                                        <span style={{
                                            backgroundColor: 'rgba(88, 166, 255, 0.1)',
                                            border: '1px solid var(--accent)',
                                            color: 'var(--accent)',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: 'bold'
                                        }}>
                                            {ep.method}
                                        </span>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 'bold' }}>
                                            {ep.path}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: '220px' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Request Body</span>
                                            <pre style={{
                                                margin: 0,
                                                padding: '12px',
                                                background: 'var(--bg)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '6px',
                                                overflowX: 'auto'
                                            }}>
                                                <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text)' }}>{ep.body}</code>
                                            </pre>
                                        </div>
                                        <div style={{ flex: 1, minWidth: '220px' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Response Payload</span>
                                            <pre style={{
                                                margin: 0,
                                                padding: '12px',
                                                background: 'var(--bg)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '6px',
                                                overflowX: 'auto'
                                            }}>
                                                <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text)' }}>{ep.response}</code>
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </PageGlow>
    )
}

export default DocsPage
