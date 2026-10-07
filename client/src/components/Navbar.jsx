import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TalentMatchLogo from './TalentMatchLogo';

export default function Navbar() {
  const { isAuthenticated, role } = useAuth();
  const dashboardPath = role === 'RECRUITER' ? '/recruiter/dashboard' : role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard';

  return (
    <header className="sticky top-0 z-30 border-b border-cream-200 bg-cream-50/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5 font-display text-xl font-bold text-ink-900">
          <TalentMatchLogo className="h-9 w-9" />
          TalentMatch AI
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-ink-600">
          <Link to="#" className="hover:text-ink-900 transition-colors">How It Works</Link>
          <Link to="#" className="hover:text-ink-900 transition-colors">For Employers</Link>
          <Link to="#" className="hover:text-ink-900 transition-colors">For Candidates</Link>
          <Link to="#" className="hover:text-ink-900 transition-colors">About Us</Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link to={dashboardPath}>
              <button className="rounded-full bg-forest-500 px-5 py-2 text-sm font-semibold text-white hover:bg-forest-600 transition-colors">
                Go to dashboard
              </button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <button className="rounded-full border border-cream-300 px-5 py-2 text-sm font-medium text-ink-700 hover:bg-cream-100 transition-colors">
                  Sign In
                </button>
              </Link>
              <Link to="/register">
                <button className="rounded-full bg-forest-500 px-5 py-2 text-sm font-semibold text-white hover:bg-forest-600 transition-colors">
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
