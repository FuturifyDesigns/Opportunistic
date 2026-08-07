/**
 * Rich listing metadata keyed by source id.
 * Used on match cards + detail pages (covers/galleries are thematic brand imagery).
 */

export const LISTING_CATALOG = {
  chevening: {
    id: 'chevening',
    kind: 'scholarship',
    title: 'Chevening Scholarships',
    source: 'Chevening',
    url: 'https://www.chevening.org/scholarships/',
    cover:
      'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80',
    ],
    summary:
      'Fully funded UK government awards for one-year master’s study. Built for emerging leaders who will return home with new networks and skills.',
    highlights: [
      'Tuition fees covered',
      'Living allowance',
      'Return airfare',
      'Arrival allowance',
      'Visa application support',
    ],
    eligibility: [
      'Citizen of a Chevening-eligible country',
      'Undergraduate degree that qualifies you for a UK master’s',
      'At least two years’ work experience (or equivalent)',
      'Apply to three eligible UK master’s courses',
      'Commit to returning home for at least two years after the award',
    ],
    level: 'Postgraduate (master’s)',
    location: 'United Kingdom',
    funding: 'Fully funded (typical package)',
    deadlineLabel: 'Usually November (check current cycle)',
    howToApply: [
      'Create a Chevening account and complete the online application',
      'Upload references and education documents',
      'Apply separately to three eligible UK university courses',
      'Prepare for interview if shortlisted',
    ],
    tips: [
      'Essays should show leadership impact, not only grades',
      'Course choices must be on the Chevening eligible list',
      'Start references early — late refs sink strong applications',
    ],
    tags: ['UK', 'Leadership', 'Fully funded', 'Master’s'],
  },
  daad: {
    id: 'daad',
    kind: 'scholarship',
    title: 'DAAD Scholarships Database',
    source: 'DAAD',
    url: 'https://www.daad.de/en/studying-in-germany/scholarships/',
    cover:
      'https://images.unsplash.com/photo-1467260209084-46767144f28b?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=900&q=80',
    ],
    summary:
      'Germany’s main scholarship gateway. Filter by degree level, subject, and nationality for study, research, and short-term awards.',
    highlights: [
      'Many STEM and research tracks',
      'Undergraduate to PhD options',
      'Monthly stipend on many programs',
      'Strong university partnerships',
    ],
    eligibility: [
      'Varies by individual DAAD program',
      'Usually requires admission/host confirmation for study awards',
      'Language requirements depend on course language (German or English)',
      'Academic transcripts and motivation letter common',
    ],
    level: 'Bachelor · Master · PhD · Research',
    location: 'Germany (and partner programs)',
    funding: 'Program-dependent',
    deadlineLabel: 'Multiple cycles — filter on DAAD site',
    howToApply: [
      'Search the DAAD database with your degree level and field',
      'Open a specific call and read host/country rules carefully',
      'Prepare language proof, CV, and academic documents',
      'Submit via the portal named in that call',
    ],
    tips: [
      'Treat DAAD as a directory — eligibility is per program, not one global rule',
      'English-taught master’s options exist; don’t assume German is always required',
    ],
    tags: ['Germany', 'Research', 'STEM', 'Directory'],
  },
  mastercard: {
    id: 'mastercard',
    kind: 'scholarship',
    title: 'Mastercard Foundation Scholars Program',
    source: 'Mastercard Foundation',
    url: 'https://mastercardfdn.org/en/scholarships/',
    cover:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=900&q=80',
    ],
    summary:
      'Partner-university scholarships focused on young people from Africa, with academic support and leadership development built in.',
    highlights: [
      'Tuition and living support at partner universities',
      'Leadership and career programming',
      'Undergraduate and postgraduate pathways',
      'Strong Africa focus',
    ],
    eligibility: [
      'Typically citizens/residents of African countries',
      'Academic merit plus demonstrated need (varies by partner)',
      'Apply through a participating university’s Scholars call',
      'Age and program limits differ by campus',
    ],
    level: 'Undergraduate · Postgraduate',
    location: 'Partner universities (Africa & global)',
    funding: 'Comprehensive support at partners',
    deadlineLabel: 'Per partner university',
    howToApply: [
      'Identify a Mastercard Foundation partner university in your field',
      'Apply to that university’s Scholars Program call',
      'Submit academic records and personal statements as required',
      'Follow interview / selection steps for that campus',
    ],
    tips: [
      'You apply to universities, not a single global form',
      'Highlight community impact alongside grades',
    ],
    tags: ['Africa', 'Partner universities', 'Leadership'],
  },
  fulbright: {
    id: 'fulbright',
    kind: 'scholarship',
    title: 'Fulbright Foreign Student Program',
    source: 'Fulbright',
    url: 'https://foreign.fulbrightonline.org/',
    cover:
      'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80',
    ],
    summary:
      'US exchange awards for graduate study and research. Applications run through your country’s Fulbright commission or US embassy.',
    highlights: [
      'Tuition and living support (package varies)',
      'US university placement support',
      'Cultural exchange emphasis',
      'Strong research and graduate focus',
    ],
    eligibility: [
      'Citizenship rules set by your local Fulbright office',
      'Bachelor’s degree (or equivalent) for most tracks',
      'English proficiency as required',
      'Commitment to return home after the grant (common condition)',
    ],
    level: 'Graduate · Research',
    location: 'United States',
    funding: 'Grant package via country commission',
    deadlineLabel: 'Country-specific (often Feb–Oct window)',
    howToApply: [
      'Find your country’s Fulbright commission / US embassy page',
      'Confirm open programs and deadlines for this year',
      'Prepare essays, transcripts, and recommendation letters',
      'Sit interviews if nominated',
    ],
    tips: [
      'Deadlines and forms differ by country — always use the local office site',
      'Research proposal clarity matters as much as GPA',
    ],
    tags: ['USA', 'Graduate', 'Exchange'],
  },
  unesco: {
    id: 'unesco',
    kind: 'scholarship',
    title: 'UNESCO Fellowships',
    source: 'UNESCO',
    url: 'https://www.unesco.org/en/fellowships',
    cover:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80',
    ],
    summary:
      'Short fellowships and capacity-building opportunities linked to education, science, culture, and communication themes.',
    highlights: [
      'Short-term professional development',
      'Theme-aligned with UNESCO priorities',
      'Useful for mid-career upskilling',
    ],
    eligibility: [
      'Varies by fellowship call',
      'Often open to professionals and researchers in UNESCO fields',
      'National commission endorsement may be required',
    ],
    level: 'Fellowship · Short program',
    location: 'International (host-dependent)',
    funding: 'Call-dependent',
    deadlineLabel: 'Rolling / per announcement',
    howToApply: [
      'Browse open UNESCO fellowship announcements',
      'Confirm whether your National Commission must endorse you',
      'Submit CV, proposal, and required forms before the call closes',
    ],
    tips: ['Match your proposal language to the published UNESCO theme'],
    tags: ['Fellowship', 'Capacity building'],
  },
  gates: {
    id: 'gates',
    kind: 'scholarship',
    title: 'Gates Cambridge Scholarship',
    source: 'Gates Cambridge',
    url: 'https://www.gatescambridge.org/',
    cover:
      'https://images.unsplash.com/photo-1564981797816-1043664bf78d?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80',
    ],
    summary:
      'Full-cost scholarships for outstanding applicants to postgraduate degrees at the University of Cambridge.',
    highlights: [
      'University fees covered',
      'Maintenance allowance',
      'Discretionary funding for academic development',
      'Highly competitive global cohort',
    ],
    eligibility: [
      'Apply to an eligible Cambridge postgraduate course',
      'Outstanding academic record',
      'Clear commitment to improving the lives of others',
      'Citizenship rules exclude UK citizens for most awards',
    ],
    level: 'Postgraduate (Cambridge)',
    location: 'Cambridge, United Kingdom',
    funding: 'Full-cost',
    deadlineLabel: 'Aligned with Cambridge course deadlines',
    howToApply: [
      'Apply for admission to Cambridge and complete the Gates section',
      'Submit references and Gates statement',
      'Departmental ranking and Gates interview stages follow',
    ],
    tips: [
      'Course fit and social-impact narrative are scrutinized closely',
      'Do not treat this as a generic funding form — specificity wins',
    ],
    tags: ['Cambridge', 'Full-cost', 'Competitive'],
  },
  african_union: {
    id: 'african_union',
    kind: 'scholarship',
    title: 'African Union Scholarship Portal',
    source: 'African Union',
    url: 'https://au.int/',
    cover:
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
    ],
    summary:
      'Continental education and mobility opportunities published through African Union channels and partner programs.',
    highlights: [
      'Africa-focused mobility',
      'Partner university calls',
      'Policy and development relevance',
    ],
    eligibility: [
      'Usually African citizenship',
      'Program-specific academic criteria',
      'Check each AU-linked call for documents and age limits',
    ],
    level: 'Varies by call',
    location: 'Africa & partner institutions',
    funding: 'Call-dependent',
    deadlineLabel: 'Per announcement',
    howToApply: [
      'Monitor AU education announcements and partner portals',
      'Confirm nationality and field eligibility',
      'Submit via the listed application channel only',
    ],
    tips: ['Bookmark AU education pages — calls open and close quickly'],
    tags: ['Africa', 'Mobility'],
  },
  scholarshipportal: {
    id: 'scholarshipportal',
    kind: 'scholarship',
    title: 'ScholarshipPortal — Europe',
    source: 'ScholarshipPortal',
    url: 'https://www.scholarshipportal.com/',
    cover:
      'https://images.unsplash.com/photo-1467260209084-46767144f28b?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=900&q=80',
    ],
    summary:
      'Searchable directory of European scholarships across universities and countries. Use filters for degree level and field.',
    highlights: [
      'Large European inventory',
      'Filter by discipline and level',
      'Direct links to university pages',
    ],
    eligibility: [
      'Depends entirely on each listed scholarship',
      'Always verify on the university’s official page',
    ],
    level: 'Directory (all levels)',
    location: 'Europe',
    funding: 'Varies by listing',
    deadlineLabel: 'Per listing',
    howToApply: [
      'Search by your field and degree level',
      'Open promising results and jump to the official university page',
      'Apply only through the official channel listed there',
    ],
    tips: ['Treat portal cards as leads — confirm dates on the source site'],
    tags: ['Europe', 'Directory'],
  },
  linkedin: {
    id: 'linkedin',
    kind: 'job',
    title: 'LinkedIn Jobs',
    source: 'LinkedIn',
    company: 'Multiple employers',
    url: 'https://www.linkedin.com/jobs/',
    cover:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=80',
    ],
    summary:
      'Professional network job search. Opportunistic builds a keyword query from your degree and selected skills, then opens LinkedIn’s board with those terms.',
    highlights: [
      'Employer-posted roles',
      'Easy company research',
      'Networking + applications in one place',
    ],
    eligibility: [
      'Role-specific — read each posting’s requirements',
      'Work authorization depends on employer and country',
    ],
    level: 'Entry to senior (role-dependent)',
    location: 'Global + remote filters',
    funding: null,
    deadlineLabel: 'Rolling postings',
    howToApply: [
      'Open the pre-filled LinkedIn search from Opportunistic',
      'Filter by experience level, remote, and date posted',
      'Tailor your résumé to the top 2–3 skill matches',
      'Apply and follow up where possible',
    ],
    tips: [
      'Sort by “Past week” to avoid stale roles',
      'Mirror the job’s skill language in your headline',
    ],
    tags: ['Jobs', 'Network', 'Global'],
  },
  indeed: {
    id: 'indeed',
    kind: 'job',
    title: 'Indeed Jobs',
    source: 'Indeed',
    company: 'Multiple employers',
    url: 'https://www.indeed.com/',
    cover:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
    ],
    summary:
      'Location-aware job board. Opportunistic passes your skills query plus country so results skew toward where you want to work.',
    highlights: [
      'Strong local inventory',
      'Salary filters on many markets',
      'Easy apply options vary by employer',
    ],
    eligibility: ['Per vacancy'],
    level: 'All levels',
    location: 'Country-biased search',
    funding: null,
    deadlineLabel: 'Rolling postings',
    howToApply: [
      'Open the Indeed link generated for your profile',
      'Refine with experience and salary filters',
      'Apply on Indeed or the employer site as prompted',
    ],
    tips: ['Keep country spelling consistent with Indeed’s location field'],
    tags: ['Jobs', 'Local'],
  },
  remoteok: {
    id: 'remoteok',
    kind: 'job',
    title: 'Remote OK',
    source: 'Remote OK',
    company: 'Remote employers',
    url: 'https://remoteok.com/',
    cover:
      'https://images.unsplash.com/photo-1498050100216-a6894dd32b31?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80',
    ],
    summary:
      'Remote-first tech and digital roles. Useful when your country should not block you from strong skill matches.',
    highlights: [
      'Remote-first listings',
      'Tech-heavy inventory',
      'Transparent salary tags on many posts',
    ],
    eligibility: [
      'Employer time-zone and contractor rules vary',
      'Some roles hire worldwide; others restrict countries',
    ],
    level: 'Mostly mid-level tech',
    location: 'Remote',
    funding: null,
    deadlineLabel: 'Fast-moving board',
    howToApply: [
      'Open the skill-slug search Opportunistic builds',
      'Read location restrictions in each post',
      'Apply with a concise skills-first résumé',
    ],
    tips: ['Confirm “worldwide” vs restricted countries before investing time'],
    tags: ['Remote', 'Tech'],
  },
  glassdoor: {
    id: 'glassdoor',
    kind: 'job',
    title: 'Glassdoor Jobs',
    source: 'Glassdoor',
    company: 'Multiple employers',
    url: 'https://www.glassdoor.com/Job/index.htm',
    cover:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80',
    ],
    summary:
      'Job search with employer reviews and interview insights. Good for comparing culture fit after Opportunistic ranks the query.',
    highlights: [
      'Company reviews',
      'Interview reports',
      'Salary estimates on many roles',
    ],
    eligibility: ['Per vacancy'],
    level: 'All levels',
    location: 'Global',
    funding: null,
    deadlineLabel: 'Rolling postings',
    howToApply: [
      'Open the Glassdoor search with your profile keywords',
      'Read recent reviews before applying',
      'Apply via Glassdoor or employer careers page',
    ],
    tips: ['Weight recent reviews higher than older ones'],
    tags: ['Jobs', 'Reviews'],
  },
  reliefweb: {
    id: 'reliefweb',
    kind: 'job',
    title: 'ReliefWeb Jobs',
    source: 'ReliefWeb',
    company: 'NGOs & agencies',
    url: 'https://reliefweb.int/jobs',
    cover:
      'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80',
    ],
    summary:
      'Humanitarian and development vacancies from NGOs and UN agencies. Stronger fit for public health, social development, and education profiles.',
    highlights: [
      'NGO / UN inventory',
      'Field and HQ roles',
      'International development focus',
    ],
    eligibility: [
      'Often requires relevant sector experience',
      'Language and duty-station rules are strict',
    ],
    level: 'Entry to specialist',
    location: 'Global duty stations',
    funding: null,
    deadlineLabel: 'Per vacancy',
    howToApply: [
      'Browse ReliefWeb jobs filtered to your themes',
      'Read duty station and language requirements carefully',
      'Apply on the agency’s own careers system',
    ],
    tips: ['Highlight field or volunteer experience clearly'],
    tags: ['NGO', 'Development', 'Humanitarian'],
  },
}

export function getListingById(id) {
  if (!id) return null
  return LISTING_CATALOG[id] || null
}

export function getListingBySource(source) {
  if (!source) return null
  const key = String(source).toLowerCase()
  return (
    Object.values(LISTING_CATALOG).find((item) => item.source.toLowerCase() === key) || null
  )
}

export function matchKey(source, title) {
  return `${String(source || '').toLowerCase()}::${String(title || '').toLowerCase()}`
}
