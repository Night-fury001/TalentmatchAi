/**
 * Calculates a simple weighted-checklist completeness percentage for a
 * JobSeekerProfile, used to nudge candidates toward a stronger profile on
 * their dashboard. Not persisted — computed on read.
 */
function calculateProfileCompleteness(profile) {
  const checks = [
    Boolean(profile.headline),
    Boolean(profile.bio),
    Boolean(profile.resumeUrl),
    Boolean(profile.avatarUrl),
    Boolean(profile.locationId),
    Array.isArray(profile.skills) && profile.skills.length > 0,
    Array.isArray(profile.educations) && profile.educations.length > 0,
    Array.isArray(profile.experiences) && profile.experiences.length > 0,
  ];
  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

module.exports = { calculateProfileCompleteness };
