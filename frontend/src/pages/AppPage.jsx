import React from 'react'
import App from '../App'
import { useApp } from '../context/AppContext'
import { getRepoColors } from '../utils/colorHash'
import PageGlow from '../components/PageGlow'

const AppPage = () => {
    const { activeRepo, repos } = useApp()
    
    const { a: colorA, b: colorB } = activeRepo
        ? getRepoColors(activeRepo)
        : { a: '#3b82f6', b: '#2563eb' }

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

    const repoName = activeRepo ? getRepoName(activeRepo) : "Get Started"
    const activeRepoMeta = repos.find(r => r.repo_url === activeRepo)
    const chunkCount = activeRepoMeta?.chunk_count
    
    const subtitle = activeRepo
        ? (chunkCount !== undefined ? `${chunkCount} chunks indexed · ready` : undefined)
        : "Index a GitHub repository to begin exploring your codebase"

    return (
        <div style={{ width: '100%', background: '#0a0a0d', display: 'flex', flexDirection: 'column' }}>
            <PageGlow
                colorA={colorA}
                colorB={colorB}
                eyebrow="Workspace"
                title={repoName}
                subtitle={subtitle}
            >
                <div style={{ width: '100%', display: 'flex' }}>
                    <App />
                </div>
            </PageGlow>
        </div>
    )
}

export default AppPage