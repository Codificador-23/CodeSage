import React from 'react'
import Navbar from './Navbar'

const PageGlow = ({ colorA, colorB, eyebrow, title, subtitle, children }) => {
    return (
        <div style={{
            position: 'relative',
            minHeight: '100vh',
            background: '#0a0a0d',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Fixed container to clip background blobs overflow and render persistence across viewport scrolls */}
            <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
                <div style={{ position: 'absolute', width: '280px', height: '280px', background: colorA, borderRadius: '50%', filter: 'blur(100px)', opacity: 0.48, top: '-100px', left: '6%', pointerEvents: 'none', transition: 'background 0.6s ease', zIndex: 0 }} />
                <div style={{ position: 'absolute', width: '240px', height: '240px', background: colorB, borderRadius: '50%', filter: 'blur(100px)', opacity: 0.28, top: '60px', right: '8%', pointerEvents: 'none', transition: 'background 0.6s ease', zIndex: 0 }} />
                <div style={{ position: 'absolute', width: '220px', height: '220px', background: colorA, borderRadius: '50%', filter: 'blur(110px)', opacity: 0.25, top: '500px', left: '2%', pointerEvents: 'none', transition: 'background 0.6s ease', zIndex: 0 }} />
                <div style={{ position: 'absolute', width: '190px', height: '190px', background: colorB, borderRadius: '50%', filter: 'blur(110px)', opacity: 0.25, top: '900px', right: '4%', pointerEvents: 'none', transition: 'background 0.6s ease', zIndex: 0 }} />
            </div>

            <div style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                flex: 1
            }}>
                <Navbar transparent themeColor={colorA} />
                <div style={{ paddingTop: '16px', paddingBottom: '8px', paddingLeft: '32px', paddingRight: '32px' }}>
                    {eyebrow && (
                        <div className="page-eyebrow" style={{ color: colorA || '#58a6ff' }}>
                            {eyebrow}
                        </div>
                    )}
                    {title && (
                        <h1 className="page-title">
                            {title}
                        </h1>
                    )}
                    {subtitle && (
                        <div className="page-subtitle">
                            {subtitle}
                        </div>
                    )}
                </div>
                {children}
            </div>
        </div>
    )
}

export default PageGlow

