import React from 'react'

const Logo = ({ size = 'sm', style = {} }) => {
    const isLg = size === 'lg'
    const iconSize = isLg ? 56 : 24
    const textSize = isLg ? '48px' : '19px'
    const gap = isLg ? '14px' : '8px'
    const weightCode = isLg ? 300 : 400
    const weightSage = isLg ? 800 : 800
    const tracking = isLg ? '-1.5px' : '-0.6px'

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: gap,
            userSelect: 'none',
            ...style
        }}>
            {/* Custom high-precision Swiss tech design SVG */}
            <svg
                width={iconSize}
                height={iconSize}
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    filter: isLg ? 'drop-shadow(0 0 16px rgba(255, 255, 255, 0.15))' : 'none',
                    transition: 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                    cursor: 'pointer'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)' }}
            >
                {/* Clean, double concentric geometric orbital rings */}
                <circle
                    cx="16"
                    cy="16"
                    r="13"
                    stroke="#94a3b8"
                    strokeWidth="1.2"
                    strokeDasharray="4 2"
                    strokeOpacity="0.45"
                />
                <circle
                    cx="16"
                    cy="16"
                    r="9"
                    stroke="#e2e8f0"
                    strokeWidth="1.5"
                    strokeOpacity="0.8"
                />

                {/* Code syntax structural diagonal line crossing */}
                <line
                    x1="12"
                    y1="20"
                    x2="20"
                    line-height="1"
                    y2="12"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                />

                {/* Wise index center code core pin */}
                <circle
                    cx="16"
                    cy="16"
                    r="3.5"
                    fill="#ffffff"
                    style={{ filter: 'drop-shadow(0 0 4px #ffffff)' }}
                />

                {/* External floating syntax nodes */}
                <circle cx="7" cy="16" r="1.5" fill="#94a3b8" fillOpacity="0.7" />
                <circle cx="25" cy="16" r="1.5" fill="#94a3b8" fillOpacity="0.7" />
            </svg>

            {/* Premium contrasting weight typography */}
            <span style={{
                fontSize: textSize,
                fontFamily: "'Plus Jakarta Sans', var(--font-ui), sans-serif",
                letterSpacing: tracking,
                display: 'inline-flex',
                alignItems: 'center',
                lineHeight: 1
            }}>
                <span style={{
                    fontWeight: weightCode,
                    color: '#94a3b8',
                    opacity: 0.95
                }}>
                    Code
                </span>
                <span style={{
                    fontWeight: weightSage,
                    color: '#ffffff'
                }}>
                    Sage
                </span>

                {/* Dynamic precise system state dot */}
                <span style={{
                    color: '#10b981',
                    fontSize: isLg ? '28px' : '15px',
                    marginLeft: '2px',
                    lineHeight: 0,
                    alignSelf: isLg ? 'flex-end' : 'center',
                    marginBottom: isLg ? '6px' : '1px'
                }}>
                    •
                </span>
            </span>
        </div>
    )
}

export default Logo
