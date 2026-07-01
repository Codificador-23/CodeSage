import React from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Logo from './Logo'

const Navbar = ({ transparent, themeColor = 'var(--accent)' }) => {
    const location = useLocation()
    const isAppRoute = location.pathname === '/app'

    return (
        <nav className="global-navbar" style={{
            height: '52px',
            backgroundColor: transparent ? 'transparent' : 'var(--bg)',
            borderBottom: transparent ? 'none' : '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: transparent ? 'relative' : 'sticky',
            top: transparent ? 'auto' : 0,
            zIndex: 100,
            width: '100%',
            flexShrink: 0
        }}>
            {/* Left Logo branding */}
            <Link to="/" style={{
                textDecoration: 'none',
                display: 'inline-flex'
            }}>
                <Logo size="sm" />
            </Link>

            {/* Right navigation links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <NavLink
                    to="/"
                    end
                    style={({ isActive }) => ({
                        color: isActive ? themeColor : 'var(--text-muted)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: 500,
                        transition: 'color 0.15s ease'
                    })}
                >
                    Home
                </NavLink>
                <NavLink
                    to="/explore"
                    style={({ isActive }) => ({
                        color: isActive ? themeColor : 'var(--text-muted)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: 500,
                        transition: 'color 0.15s ease'
                    })}
                >
                    Explore
                </NavLink>
                <NavLink
                    to="/history"
                    style={({ isActive }) => ({
                        color: isActive ? themeColor : 'var(--text-muted)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: 500,
                        transition: 'color 0.15s ease'
                    })}
                >
                    History
                </NavLink>
                <NavLink
                    to="/compare"
                    style={({ isActive }) => ({
                        color: isActive ? themeColor : 'var(--text-muted)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: 500,
                        transition: 'color 0.15s ease'
                    })}
                >
                    Compare
                </NavLink>
                <NavLink
                    to="/docs"
                    style={({ isActive }) => ({
                        color: isActive ? themeColor : 'var(--text-muted)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: 500,
                        transition: 'color 0.15s ease'
                    })}
                >
                    Documentation
                </NavLink>
                <NavLink
                    to="/settings"
                    style={({ isActive }) => ({
                        color: isActive ? themeColor : 'var(--text-muted)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: 500,
                        transition: 'color 0.15s ease'
                    })}
                >
                    Settings
                </NavLink>


                {!isAppRoute && (
                    <Link
                        to="/app"
                        style={{
                            backgroundColor: themeColor,
                            color: 'var(--bg)',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: 600,
                            transition: 'opacity 0.15s ease'
                        }}
                        className="navbar-cta-btn"
                        onMouseEnter={(e) => e.target.style.opacity = 0.9}
                        onMouseLeave={(e) => e.target.style.opacity = 1}
                    >
                        Launch App
                    </Link>
                )}
            </div>
        </nav>
    )
}

export default Navbar
