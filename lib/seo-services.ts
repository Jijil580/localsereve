export const SITE_URL = "https://www.nearleo.com";

export type SeoService = {
  name: string;
  slug: string;
  summary: string;
  commonNeeds: string[];
};

export const seoServices: SeoService[] = [
  {
    name: "Plumber",
    slug: "plumber",
    summary: "Find nearby plumbers for leaks, pipe repairs, bathroom fittings, water lines and urgent plumbing work.",
    commonNeeds: ["Leak and pipe repair", "Tap and bathroom fitting", "Water-line troubleshooting"],
  },
  {
    name: "Electrician",
    slug: "electrician",
    summary: "Discover local electricians for wiring, switches, lighting, fault checks and electrical installations.",
    commonNeeds: ["Wiring and rewiring", "Switch and lighting work", "Electrical fault checks"],
  },
  {
    name: "Carpenter",
    slug: "carpenter",
    summary: "Browse carpenters for furniture repair, cabinets, doors, fittings and custom woodwork near you.",
    commonNeeds: ["Furniture repair", "Cabinets and storage", "Doors and custom woodwork"],
  },
  {
    name: "Mason",
    slug: "mason",
    summary: "Connect with local masons for walls, repairs, blockwork, small construction jobs and renovation work.",
    commonNeeds: ["Wall and blockwork", "Structural repairs", "Renovation support"],
  },
  {
    name: "Interlock paving",
    slug: "interlock-paving",
    summary: "Find interlock paving professionals for driveways, pathways, courtyards and outdoor paving repairs.",
    commonNeeds: ["Driveway paving", "Pathways and courtyards", "Paver repair and relaying"],
  },
  {
    name: "Hollow-brick work",
    slug: "hollow-brick-work",
    summary: "Browse hollow-brick workers for walls, partitions, extensions and local building projects.",
    commonNeeds: ["Hollow-block walls", "Room partitions", "Building extensions"],
  },
  {
    name: "Painter",
    slug: "painter",
    summary: "Find house and commercial painters for interior finishes, exterior coatings and repainting work.",
    commonNeeds: ["Interior painting", "Exterior painting", "Surface preparation"],
  },
  {
    name: "Plastering worker",
    slug: "plastering-worker",
    summary: "Connect with plastering workers for new walls, ceiling finishes, patch repairs and renovation projects.",
    commonNeeds: ["Wall plastering", "Ceiling finishes", "Crack and patch repair"],
  },
  {
    name: "Tile worker",
    slug: "tile-worker",
    summary: "Discover tile workers for floors, bathrooms, kitchens, wall tiles and tile replacement near you.",
    commonNeeds: ["Floor tiling", "Bathroom and kitchen tiles", "Tile replacement"],
  },
  {
    name: "House-cleaning service",
    slug: "house-cleaning-service",
    summary: "Find local house-cleaning professionals for regular cleaning, deep cleaning and move-in preparation.",
    commonNeeds: ["Deep cleaning", "Regular home cleaning", "Move-in cleaning"],
  },
  {
    name: "Pest-control service",
    slug: "pest-control-service",
    summary: "Browse pest-control providers for home inspections and treatment of common household pests.",
    commonNeeds: ["Home pest inspection", "Targeted pest treatment", "Preventive pest control"],
  },
  {
    name: "Air-conditioner installation and repair",
    slug: "ac-installation-repair",
    summary: "Connect with AC technicians for installation, servicing, cooling issues and air-conditioner repairs.",
    commonNeeds: ["AC installation", "Routine AC service", "Cooling and repair work"],
  },
  {
    name: "Appliance repair",
    slug: "appliance-repair",
    summary: "Find nearby appliance technicians for diagnosis, maintenance and repair of common home appliances.",
    commonNeeds: ["Appliance diagnosis", "Part replacement", "Preventive maintenance"],
  },
  {
    name: "CCTV installation",
    slug: "cctv-installation",
    summary: "Discover CCTV professionals for camera planning, installation, setup and maintenance near you.",
    commonNeeds: ["Camera installation", "Recorder and app setup", "CCTV maintenance"],
  },
  {
    name: "Mobile-phone repair",
    slug: "mobile-phone-repair",
    summary: "Browse local mobile-phone repair professionals for screens, batteries, charging and device faults.",
    commonNeeds: ["Screen replacement", "Battery and charging repair", "Device fault diagnosis"],
  },
  {
    name: "Car mechanic",
    slug: "car-mechanic",
    summary: "Find car mechanics for routine service, repairs, inspections and vehicle troubleshooting nearby.",
    commonNeeds: ["Routine vehicle service", "Mechanical repairs", "Fault inspection"],
  },
  {
    name: "Packers and movers",
    slug: "packers-and-movers",
    summary: "Connect with local packers and movers for home shifting, office moves and careful transport support.",
    commonNeeds: ["Home shifting", "Office relocation", "Packing and transport"],
  },
  {
    name: "Photographer",
    slug: "photographer",
    summary: "Discover photographers for family events, business shoots, portraits and local celebrations.",
    commonNeeds: ["Event photography", "Portrait sessions", "Business photography"],
  },
  {
    name: "Home nurse",
    slug: "home-nurse",
    summary: "Find home-nursing professionals and discuss availability, experience and care requirements directly.",
    commonNeeds: ["Recovery support", "Routine home care", "Care requirement discussions"],
  },
  {
    name: "Tutor",
    slug: "tutor",
    summary: "Browse local tutors by subject, location and profile to find learning support near you.",
    commonNeeds: ["School subject support", "Exam preparation", "Individual learning help"],
  },
];

export function findSeoService(slug: string) {
  return seoServices.find((service) => service.slug === slug);
}
