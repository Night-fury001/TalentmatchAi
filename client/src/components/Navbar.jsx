import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TalentMatchLogo from './TalentMatchLogo';

export default function Navbar() {
  const { isAuthenticated, role } = useAuth();
  const dashboardPath =
    role === 'RECRUITER' ? '/recruiter/dashboard'
    : role === 'ADMIN'  ? '/admin/dashboard'
    : '/client/dashboard';

  return (
    <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-md" style={{ borderBottom: '1px solid transparent' }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">

        {/* Logo + wordmark */}
        <Link to="/" className="flex items-center gap-2.5 select-none">
          <TalentMatchLogo className="h-9 w-9" />
          <span className="font-display text-[17px] font-bold text-ink-900 tracking-tight">TalentMatch AI</span>
        </Link>

        {/* Nav links — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-7">
          {['How It Works', 'For Employers', 'For Candidates', 'About Us'].map(label => (
            <Link
              key={label}
              to="#"
              className="text-[13.5px] font-medium text-ink-600 hover:text-ink-900 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth buttons */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link to={dashboardPath}>
              <button
                className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-colors"
                style={{ background: '#2d6b30' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#235326')}
                onMouseLeave={e => (e.currentTarget.style.background = '#2d6b30')}
              >
                Go to dashboard
              </button>
            </Link>
          ) : (
            <>
              {/* Sign In — plain text, no border */}
              <Link
                to="/login"
                className="text-[13.5px] font-medium text-ink-700 hover:text-ink-900 transition-colors"
              >
                Sign In
              </Link>
              {/* Get Started — filled green pill */}
              <Link to="/register">
                <button
                  className="rounded-full px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors"
                  style={{ background: '#2d6b30' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#235326')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#2d6b30')}
                >
                  Get Started
                </button>
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
