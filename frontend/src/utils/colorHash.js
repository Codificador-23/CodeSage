const PALETTE = [
    { a: '#06b6d4', b: '#0891b2' }, // bright cyan
    { a: '#d946ef', b: '#c026d3' }, // bright magenta
    { a: '#14b8a6', b: '#0d9488' }, // bright teal
    { a: '#6366f1', b: '#4f46e5' }, // bright indigo
    { a: '#ec4899', b: '#db2777' }, // bright pink
    { a: '#84cc16', b: '#65a30d' }, // bright lime
    { a: '#fbbf24', b: '#f59e0b' }, // bright amber
    { a: '#3b82f6', b: '#2563eb' }, // bright blue
]

export function getRepoColors(repoUrl) {
    if (!repoUrl) return PALETTE[0]
    let hash = 0
    for (let i = 0; i < repoUrl.length; i++) {
        hash = repoUrl.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % PALETTE.length
    return PALETTE[index]
}
