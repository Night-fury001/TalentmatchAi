export default function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-ink-500">© {new Date().getFullYear()} TalentMatch AI. Find your next role, faster.</p>
        <p className="text-xs text-ink-400">Built with care for job seekers and hiring teams alike.</p>
      </div>
    </footer>
  );
}
