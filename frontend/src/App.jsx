import React from 'react'
import { useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import RepoInput from './components/RepoInput'

function App() {
    const {
        repos,
        activeRepo,
        activeChatSession,
        chatArchive,
        isIngesting,
        ingestStatus,
        error,
        showFullInput,
        handleIngest,
        handleSelectRepo,
        handleAddRepoClick,
        handleSendMessage,
        clearActiveChat,
        progress,
        alreadyIndexed,
        pendingRepoUrl
    } = useApp()

    // Determine current view
    if (showFullInput && repos.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', minHeight: '100%', width: '100%' }}>
                <div className="fullscreen-box" style={{ width: '100%', maxWidth: '520px' }}>
                    <RepoInput
                        onIngest={handleIngest}
                        isIngesting={isIngesting}
                        status={ingestStatus}
                        error={error}
                        isFullScreen={true}
                        progress={progress}
                        alreadyIndexed={alreadyIndexed}
                        pendingRepoUrl={pendingRepoUrl}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="app-container" style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
            <Sidebar
                repos={repos}
                activeRepo={activeRepo}
                onSelectRepo={handleSelectRepo}
                onAddRepo={handleAddRepoClick}
                onNewChat={() => clearActiveChat(activeRepo)}
            />
            <div className="chat-workspace">
                {showFullInput ? (
                     <div style={{ padding: '40px', maxWidth: '600px', margin: 'auto', width: '100%' }}>
                        <h2 style={{ marginBottom: '20px', color: '#fff' }}>Index New Repository</h2>
                        <RepoInput
                            onIngest={handleIngest}
                            isIngesting={isIngesting}
                            status={ingestStatus}
                            error={error}
                            isFullScreen={false}
                            progress={progress}
                            alreadyIndexed={alreadyIndexed}
                            pendingRepoUrl={pendingRepoUrl}
                        />
                    </div>
                ) : (
                    <ChatWindow
                        activeRepo={activeRepo}
                        messages={activeChatSession[activeRepo] || []}
                        archivedMessages={chatArchive[activeRepo] || []}
                        onSendMessage={handleSendMessage}
                    />
                )}
            </div>
        </div>
    )
}

export default App
