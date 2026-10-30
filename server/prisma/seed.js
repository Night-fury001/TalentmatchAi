/**
 * Database Seed Script
 * Seeds: platform admin, base taxonomy (categories, locations, skills),
 * and a demo recruiter + company + job posting for local development.
 *
 * Run with: npm run prisma:seed   (from /server)
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

const CATEGORIES = [
  { name: 'Software Engineering', description: 'Backend, frontend, full-stack and platform roles.' },
  { name: 'Data & Analytics', description: 'Data science, analytics, and machine learning roles.' },
  { name: 'Product Management', description: 'Product strategy, discovery, and delivery roles.' },
  { name: 'Design', description: 'Product design, UX research, and visual design roles.' },
  { name: 'DevOps & Infrastructure', description: 'Cloud, SRE, platform, and infrastructure roles.' },
  { name: 'Marketing', description: 'Growth, content, brand, and performance marketing roles.' },
  { name: 'Sales', description: 'Account executive, SDR, and revenue roles.' },
  { name: 'Customer Success', description: 'Support, success, and account management roles.' },
  { name: 'Human Resources', description: 'Recruiting, people ops, and HR business partner roles.' },
  { name: 'Finance & Accounting', description: 'Finance, FP&A, and accounting roles.' },
];

const LOCATIONS = [
  { city: 'San Francisco', state: 'CA', country: 'United States' },
  { city: 'New York', state: 'NY', country: 'United States' },
  { city: 'Austin', state: 'TX', country: 'United States' },
  { city: 'Seattle', state: 'WA', country: 'United States' },
  { city: 'Bengaluru', state: 'Karnataka', country: 'India' },
  { city: 'Pune', state: 'Maharashtra', country: 'India' },
  { city: 'London', state: null, country: 'United Kingdom' },
  { city: 'Berlin', state: null, country: 'Germany' },
  { city: 'Toronto', state: 'Ontario', country: 'Canada' },
  { city: 'Remote', state: null, country: 'Global' },
];

const SKILLS = [
  { name: 'JavaScript', category: 'Programming Languages' },
  { name: 'TypeScript', category: 'Programming Languages' },
  { name: 'Python', category: 'Programming Languages' },
  { name: 'Java', category: 'Programming Languages' },
  { name: 'Go', category: 'Programming Languages' },
  { name: 'React', category: 'Frontend' },
  { name: 'Next.js', category: 'Frontend' },
  { name: 'Vue.js', category: 'Frontend' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'Express', category: 'Backend' },
  { name: 'NestJS', category: 'Backend' },
  { name: 'Django', category: 'Backend' },
  { name: 'PostgreSQL', category: 'Databases' },
  { name: 'MongoDB', category: 'Databases' },
  { name: 'MySQL', category: 'Databases' },
  { name: 'Redis', category: 'Databases' },
  { name: 'Docker', category: 'DevOps' },
  { name: 'Kubernetes', category: 'DevOps' },
  { name: 'AWS', category: 'Cloud' },
  { name: 'GCP', category: 'Cloud' },
  { name: 'Azure', category: 'Cloud' },
  { name: 'CI/CD', category: 'DevOps' },
  { name: 'GraphQL', category: 'API' },
  { name: 'REST APIs', category: 'API' },
  { name: 'Machine Learning', category: 'Data Science' },
  { name: 'Data Analysis', category: 'Data Science' },
  { name: 'SQL', category: 'Data Science' },
  { name: 'Figma', category: 'Design' },
  { name: 'UI/UX Design', category: 'Design' },
  { name: 'Product Strategy', category: 'Product' },
  { name: 'Agile/Scrum', category: 'Product' },
  { name: 'Communication', category: 'Soft Skills' },
  { name: 'Leadership', category: 'Soft Skills' },
  { name: 'Problem Solving', category: 'Soft Skills' },
];

async function main() {
  console.log('Seeding database...');

  // --- Admin user ---
  const adminEmail = 'admin@jobportal.dev';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@12345', SALT_ROUNDS);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        isVerified: true,
        isActive: true,
      },
    });
    console.log(`  Created admin user: ${adminEmail} / Admin@12345`);
  } else {
    console.log('  Admin user already exists, skipping.');
  }

  // --- Categories ---
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name, slug: slugify(cat.name), description: cat.description },
    });
  }
  console.log(`  Upserted ${CATEGORIES.length} categories.`);

  // --- Locations ---
  for (const loc of LOCATIONS) {
    const existing = await prisma.location.findFirst({
      where: { city: loc.city, state: loc.state, country: loc.country },
    });
    if (!existing) {
      await prisma.location.create({ data: loc });
    }
  }
  console.log(`  Upserted ${LOCATIONS.length} locations.`);

  // --- Skills ---
  for (const skill of SKILLS) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: { name: skill.name, slug: slugify(skill.name), category: skill.category },
    });
  }
  console.log(`  Upserted ${SKILLS.length} skills.`);

  // --- Demo recruiter + company + job (idempotent) ---
  const recruiterEmail = 'recruiter@demo.dev';
  let recruiterUser = await prisma.user.findUnique({ where: { email: recruiterEmail } });
  if (!recruiterUser) {
    const passwordHash = await bcrypt.hash('Recruiter@12345', SALT_ROUNDS);
    recruiterUser = await prisma.user.create({
      data: {
        email: recruiterEmail,
        passwordHash,
        role: 'RECRUITER',
        isVerified: true,
        isActive: true,
        recruiterProfile: {
          create: {
            fullName: 'Demo Recruiter',
            jobTitle: 'Talent Acquisition Lead',
          },
        },
      },
      include: { recruiterProfile: true },
    });
    console.log(`  Created demo recruiter: ${recruiterEmail} / Recruiter@12345`);

    const sfLocation = await prisma.location.findFirst({ where: { city: 'San Francisco' } });
    const remoteLocation = await prisma.location.findFirst({ where: { city: 'Remote' } });
    const engCategory = await prisma.category.findUnique({ where: { name: 'Software Engineering' } });

    const company = await prisma.company.create({
      data: {
        recruiterId: recruiterUser.recruiterProfile.id,
        name: 'Northa Technologies',
        slug: slugify('Northa Technologies'),
        website: 'https://northa.example.com',
        description: 'We build tools that help teams hire the right people, faster.',
        industry: 'Software',
        size: '51-200',
        headquartersId: sfLocation ? sfLocation.id : null,
        verifiedByAdmin: true,
      },
    });

    const reactSkill = await prisma.skill.findUnique({ where: { name: 'React' } });
    const nodeSkill = await prisma.skill.findUnique({ where: { name: 'Node.js' } });
    const tsSkill = await prisma.skill.findUnique({ where: { name: 'TypeScript' } });

    const job = await prisma.job.create({
      data: {
        companyId: company.id,
        title: 'Senior Full-Stack Engineer',
        slug: slugify('Senior Full-Stack Engineer Northa'),
        description:
          'We are looking for a Senior Full-Stack Engineer to help build the next generation of our AI-powered hiring platform. You will work across the stack, from React interfaces to Node.js services.',
        requirements:
          '5+ years of professional experience building web applications. Strong command of React, Node.js, and TypeScript. Experience with relational databases and REST API design.',
        responsibilities:
          'Design and ship end-to-end features. Collaborate closely with product and design. Mentor junior engineers and participate in code reviews.',
        benefits: 'Competitive salary, equity, remote-friendly culture, health coverage, annual learning budget.',
        categoryId: engCategory.id,
        locationId: remoteLocation ? remoteLocation.id : sfLocation.id,
        jobType: 'FULL_TIME',
        workMode: 'REMOTE',
        experienceLevel: 'SENIOR',
        salaryMin: 130000,
        salaryMax: 170000,
        currency: 'USD',
        status: 'OPEN',
        vacancies: 2,
      },
    });

    const skillLinks = [reactSkill, nodeSkill, tsSkill].filter(Boolean);
    for (const skill of skillLinks) {
      await prisma.jobSkill.create({
        data: { jobId: job.id, skillId: skill.id, isRequired: true, weight: 1.0 },
      });
    }
    console.log('  Created demo company "Northa Technologies" with 1 open job.');
  } else {
    console.log('  Demo recruiter already exists, skipping demo company/job seed.');
  }

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
