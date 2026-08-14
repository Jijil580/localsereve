export const SITE_URL = "https://www.nearleo.com";

export type SeoService = {
  name: string;
  slug: string;
  summary: string;
  commonNeeds: string[];
  kannurSearchTitle?: string;
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
    kannurSearchTitle: "Electrician in Kannur",
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
    kannurSearchTitle: "Interlock Paving in Kannur",
    summary: "Find interlock paving professionals for driveways, pathways, courtyards and outdoor paving repairs.",
    commonNeeds: ["Driveway paving", "Pathways and courtyards", "Paver repair and relaying"],
  },
  {
    name: "Hollow-brick work",
    slug: "hollow-brick-work",
    kannurSearchTitle: "Hollow-Brick Workers in Kannur",
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
  {
    name: "Lottery service",
    slug: "lottery-service",
    summary: "Find published local lottery service and shop profiles, then confirm licensing, ticket availability and opening hours directly.",
    commonNeeds: ["Nearby lottery shop", "Ticket availability", "Opening-hour enquiry"],
  },
  {
    name: "Retail store",
    slug: "retail-store",
    summary: "Browse local retail stores and contact them directly for products, stock, prices and opening hours.",
    commonNeeds: ["Product availability", "Store location", "Price and opening-hour enquiry"],
  },
  {
    name: "Rubber tapping worker",
    slug: "rubber-tapping-worker",
    summary: "Find nearby rubber tapping workers and discuss plantation size, schedule, experience and service charges directly.",
    commonNeeds: ["Regular rubber tapping", "Seasonal tapping work", "Plantation work enquiry"],
  },
  {
    name: "Coconut picker",
    slug: "coconut-picker",
    summary: "Connect with local coconut pickers for coconut harvesting and tree-climbing work near you.",
    commonNeeds: ["Coconut harvesting", "Scheduled tree climbing", "Multiple-tree work"],
  },
  {
    name: "Barber",
    slug: "barber",
    summary: "Discover nearby barbers and barber shops, compare profiles and contact them for services and availability.",
    commonNeeds: ["Haircut", "Grooming service", "Barber-shop availability"],
  },
  {
    name: "Chicken shop",
    slug: "chicken-shop",
    summary: "Browse local chicken shop profiles and confirm availability, prices, preparation options and opening hours directly.",
    commonNeeds: ["Fresh chicken availability", "Price enquiry", "Shop opening hours"],
  },
  {
    name: "Beef stall",
    slug: "beef-stall",
    summary: "Find published local beef stall profiles and confirm availability, prices and opening hours directly.",
    commonNeeds: ["Product availability", "Price enquiry", "Shop opening hours"],
  },
  {
    name: "Mobile shop",
    slug: "mobile-shop",
    summary: "Find nearby mobile shops for phones, accessories and device-related enquiries.",
    commonNeeds: ["Phone availability", "Mobile accessories", "Store and price enquiry"],
  },
  {
    name: "Restaurant",
    slug: "restaurant",
    summary: "Discover local restaurant profiles and contact them for menus, opening hours, reservations and dining enquiries.",
    commonNeeds: ["Menu enquiry", "Opening hours", "Table and order enquiry"],
  },
  {
    name: "Autorickshaw service",
    slug: "autorickshaw-service",
    summary: "Find local autorickshaw services and discuss pickup point, destination, availability and fare directly.",
    commonNeeds: ["Local trip", "Pickup enquiry", "Fare and availability"],
  },
  {
    name: "Traveller van service",
    slug: "traveller-van-service",
    summary: "Browse traveller van services for local trips, group travel, events and outstation journeys.",
    commonNeeds: ["Group travel", "Event transport", "Outstation journey"],
  },
  {
    name: "Ambulance service",
    slug: "ambulance-service",
    summary: "Find published ambulance service profiles and confirm coverage and availability directly. For a life-threatening emergency, contact the appropriate emergency authority immediately.",
    commonNeeds: ["Patient transport enquiry", "Service-area confirmation", "Availability and charges"],
  },
  {
    name: "Pharmacy",
    slug: "pharmacy",
    summary: "Find nearby pharmacy profiles and contact them directly for medicine availability, opening hours and store location.",
    commonNeeds: ["Medicine availability", "Opening-hour enquiry", "Pharmacy location"],
  },
  {
    name: "Dental clinic",
    slug: "dental-clinic",
    summary: "Browse published dental clinic profiles and contact the clinic to confirm services, credentials and appointments.",
    commonNeeds: ["Appointment enquiry", "Clinic services", "Location and opening hours"],
  },
  {
    name: "Hospital",
    slug: "hospital",
    summary: "Find published hospital profiles and contact the facility for departments, availability and directions. Nearleo is not an emergency service.",
    commonNeeds: ["Department enquiry", "Facility directions", "Availability information"],
  },
  {
    name: "Medical laboratory",
    slug: "medical-laboratory",
    summary: "Browse medical laboratory profiles and contact them for available tests, preparation guidance, collection options and opening hours.",
    commonNeeds: ["Test availability", "Sample collection enquiry", "Opening hours"],
  },
];

export function findSeoService(slug: string) {
  return seoServices.find((service) => service.slug === slug);
}

export function findSeoServiceByName(name: string) {
  return seoServices.find((service) => service.name.toLowerCase() === name.toLowerCase());
}
