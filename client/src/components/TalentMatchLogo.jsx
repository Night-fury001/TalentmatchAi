export default function TalentMatchLogo({ className = 'h-8 w-8' }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="white"/>
      <ellipse cx="22" cy="16" rx="9" ry="6" transform="rotate(-30 22 16)" fill="#2d6b30" opacity="0.9"/>
      <ellipse cx="18" cy="24" rx="9" ry="6" transform="rotate(-30 18 24)" fill="#c04a18" opacity="0.85"/>
      <circle cx="20" cy="20" r="2.5" fill="white"/>
    </svg>
  );
}
