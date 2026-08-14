const english = {
  home: "Home", findServices: "Find services", myRequests: "My requests", messages: "Messages",
  setLocation: "Set location", forProfessionals: "For professionals", signIn: "Sign in",
  profileDashboard: "Profile and dashboard", manageAccount: "Manage your Nearleo account", changeLocation: "Change location",
  chooseSearchArea: "Choose your search area", logOut: "Log out", endSession: "Securely end this session",
  trustedNearby: "Trusted professionals, just around you", heroTitle: "Find trusted local professionals", nearYou: "near you.",
  heroDescription: "From small repairs to big projects, find verified experts for every service you need.",
  service: "Service", servicePlaceholder: "Plumber, electrician, carpenter…", yourLocation: "Your location", location: "Kochi, Kerala",
  radius: "Radius", searchNow: "Search now", reviewedProfiles: "Clear verification status", startingPrices: "Provider-set starting prices",
  locationDiscovery: "Location-based discovery", savedReplies: "Saved requests and replies", localExpertise: "Local expertise",
  skilledService: "Skilled service", nearbyProfessionals: "Nearby professionals", approvedProfiles: "Professional profiles",
  directEnquiries: "Direct enquiries", builtForCommunities: "Built for local communities", exploreServices: "Explore services",
  needHelp: "What do you need help with?", viewAllServices: "View all services", browseService: "Browse service",
  exploreCategories: "Explore categories", topNearby: "Top professionals near you", realProfessionals: "Compare nearby professionals and look for the green verified badge on admin-approved profiles.",
  seeAllProfessionals: "See all professionals", noProviders: "No providers have published profiles yet",
  providersSoon: "New professionals will appear here as they complete their profiles.", firstProfessional: "Become the first professional",
  simpleSecure: "Simple & secure", easyTitle: "From search to service, we make it easy.",
  easyDescription: "Book confidently with verified professionals and transparent updates at every step.", postRequest: "Post a service request",
  step1Title: "Tell us what you need", step1Body: "Search or post your requirement in under a minute.",
  step2Title: "Choose a professional", step2Body: "Compare profiles, prices, portfolios and verified reviews.",
  step3Title: "Book and relax", step3Body: "Follow the request and contact your selected professional.", growBusiness: "Grow your business",
  professionalCta: "Skilled professional? Meet your next customer.", professionalCtaBody: "Create a free profile, showcase your work and receive nearby enquiries.",
  joinProfessional: "Join as a professional", discoverProfessionals: "Discover professionals", findRightExpert: "Find the right expert nearby",
  allServices: "All services", searchPlaceholder: "Search service, provider or business", search: "Search", searchingNear: "Searching near",
  change: "Change", filters: "Filters", reset: "Reset", distance: "Distance", trustAvailability: "Trust & availability",
  verifiedOnly: "Verified providers only", availableToday: "Available today", emergencyService: "Emergency service", homeVisit: "Home visit",
  minimumRating: "Minimum rating", priceRange: "Price range", professionalsFound: "professionals found", within: "Within", of: "of",
  recommended: "Recommended", nearestFirst: "Nearest first", highestRated: "Highest rated", lowestPrice: "Lowest price",
  noProfessionals: "No professionals found", widenSearch: "Try a wider distance or fewer filters.", search60: "Search within 60 km",
  completeDirectory: "Complete directory", chooseService: "Choose a service to find matching professionals near you.",
  viewProfile: "View profile", requestService: "Request service", save: "Save", saved: "Saved", available: "Available today",
  availabilityUnknown: "Availability not confirmed", reviewed: "ID & profile reviewed", newNearlio: "New on Nearleo",
  noReviews: "No customer reviews yet", startsFrom: "Starts from", askEstimate: "Ask for an estimate", noJobs: "No completed jobs yet",
  customers: "Customers", safety: "Safety", professionals: "Professionals", joinNearlio: "Join Nearleo", plansPricing: "Plans & pricing",
  providerHelp: "Provider help", company: "Company", about: "About", contact: "Contact", privacyTerms: "Privacy & terms",
  tagline: "Where Local Experts Meet Local Customers.", poweredBy: "Powered by", explore: "Explore", requests: "Requests", inbox: "Inbox", account: "Account",
  exactMatch: "Exact match", suggestedService: "Suggested service", languageLabel: "Language",
  welcome: "Welcome to Nearleo", signInAccount: "Sign in to your account", createNearlioAccount: "Create your Nearleo account",
  loginDescription: "Manage bookings, quotes and messages securely.", registerDescription: "Join as a customer or start receiving nearby service enquiries.",
  createAccount: "Create account", fullName: "Full name", emailAddress: "Email address", mobileNumber: "Mobile number", joinAs: "I want to join as",
  customerBook: "Customer — book services", providerReceive: "Service professional — receive work", emailMobile: "Email or mobile number", password: "Password",
  passwordPlaceholder: "At least 8 characters", passwordHint: "Use uppercase, lowercase and at least one number.",
  consent: "I agree to the Nearleo User Terms and Privacy Notice, including the rules against unwanted messages and misuse of contact details.",
  readTerms: "Read terms", pleaseWait: "Please wait…", agreeSignIn: "Agree & sign in", agreeCreate: "Agree & create account",
  passwordSecure: "Your password is securely hashed and never stored as plain text.",
  nearleoStandard: "The Nearleo standard", trustTitle: "Local services with clarity at every step.",
  browseFreely: "Browse freely", browseFreelyBody: "Explore every published professional before creating an account.",
  privacyFirst: "Privacy-first contact", privacyFirstBody: "WhatsApp details stay private until the provider approves access.",
  verificationClarity: "Visible verification", verificationClarityBody: "Admin-verified profiles receive a clear green trust badge.",
  locationControl: "You control location", locationControlBody: "Change your search area anytime to discover relevant local experts."
} as const;

type TranslationTable = { [K in keyof typeof english]: string };

function withEnglish(overrides: Partial<TranslationTable>): TranslationTable {
  return { ...english, ...overrides };
}

const malayalam: TranslationTable = {
  home: "ഹോം", findServices: "സേവനങ്ങൾ കണ്ടെത്തുക", myRequests: "എന്റെ അഭ്യർത്ഥനകൾ", messages: "സന്ദേശങ്ങൾ",
  setLocation: "സ്ഥലം സജ്ജമാക്കുക", forProfessionals: "പ്രൊഫഷണലുകൾക്ക്", signIn: "ലോഗിൻ",
  profileDashboard: "പ്രൊഫൈലും ഡാഷ്ബോർഡും", manageAccount: "Nearleo അക്കൗണ്ട് നിയന്ത്രിക്കുക", changeLocation: "സ്ഥലം മാറ്റുക",
  chooseSearchArea: "തിരയേണ്ട സ്ഥലം തിരഞ്ഞെടുക്കുക", logOut: "ലോഗൗട്ട്", endSession: "സുരക്ഷിതമായി സെഷൻ അവസാനിപ്പിക്കുക",
  trustedNearby: "വിശ്വസ്ത പ്രൊഫഷണലുകൾ നിങ്ങളുടെ സമീപത്ത്", heroTitle: "വിശ്വസ്തരായ പ്രാദേശിക വിദഗ്ധരെ കണ്ടെത്തൂ", nearYou: "നിങ്ങളുടെ സമീപത്ത്.",
  heroDescription: "ചെറിയ അറ്റകുറ്റപ്പണി മുതൽ വലിയ പദ്ധതികൾ വരെ, ആവശ്യമായ എല്ലാ സേവനത്തിനും പരിശോധിച്ച വിദഗ്ധരെ കണ്ടെത്തൂ.",
  service: "സേവനം", servicePlaceholder: "പ്ലംബർ, ഇലക്ട്രീഷ്യൻ, കാർപെന്റർ…", yourLocation: "നിങ്ങളുടെ സ്ഥലം", location: "കൊച്ചി, കേരളം",
  radius: "ദൂരം", searchNow: "ഇപ്പോൾ തിരയുക", reviewedProfiles: "വ്യക്തമായ വെരിഫിക്കേഷൻ നില", startingPrices: "പ്രൊവൈഡർ നിശ്ചയിച്ച ആരംഭ നിരക്ക്",
  locationDiscovery: "സ്ഥലം അടിസ്ഥാനമാക്കിയ കണ്ടെത്തൽ", savedReplies: "സേവ് ചെയ്ത അഭ്യർത്ഥനകളും മറുപടികളും", localExpertise: "പ്രാദേശിക വൈദഗ്ധ്യം",
  skilledService: "നൈപുണ്യമുള്ള സേവനം", nearbyProfessionals: "സമീപത്തെ പ്രൊഫഷണലുകൾ", approvedProfiles: "പ്രൊഫഷണൽ പ്രൊഫൈലുകൾ",
  directEnquiries: "നേരിട്ടുള്ള അന്വേഷണങ്ങൾ", builtForCommunities: "പ്രാദേശിക സമൂഹങ്ങൾക്കായി", exploreServices: "സേവനങ്ങൾ പരിശോധിക്കുക",
  needHelp: "ഏത് സേവനമാണ് ആവശ്യം?", viewAllServices: "എല്ലാ സേവനങ്ങളും കാണുക", browseService: "സേവനം കാണുക",
  exploreCategories: "വിഭാഗങ്ങൾ പരിശോധിക്കുക", topNearby: "നിങ്ങളുടെ സമീപത്തെ മികച്ച പ്രൊഫഷണലുകൾ", realProfessionals: "സമീപത്തെ പ്രൊഫഷണലുകളെ താരതമ്യം ചെയ്യൂ; അഡ്മിൻ അംഗീകരിച്ച പ്രൊഫൈലുകളിൽ പച്ച വെരിഫൈഡ് ബാഡ്ജ് കാണാം.",
  seeAllProfessionals: "എല്ലാ പ്രൊഫഷണലുകളെയും കാണുക", noProviders: "ഇതുവരെ പ്രൊവൈഡർ പ്രൊഫൈലുകൾ ലഭ്യമല്ല",
  providersSoon: "പ്രൊഫൈൽ പൂർത്തിയാക്കുന്ന പുതിയ പ്രൊഫഷണലുകൾ ഇവിടെ പ്രത്യക്ഷപ്പെടും.", firstProfessional: "ആദ്യ പ്രൊഫഷണലാകൂ",
  simpleSecure: "ലളിതവും സുരക്ഷിതവും", easyTitle: "തിരച്ചിൽ മുതൽ സേവനം വരെ എല്ലാം എളുപ്പം.",
  easyDescription: "പരിശോധിച്ച പ്രൊഫഷണലുകളെയും ഓരോ ഘട്ടത്തിലുമുള്ള വ്യക്തമായ അപ്ഡേറ്റുകളെയും ആശ്രയിച്ച് ആത്മവിശ്വാസത്തോടെ തിരഞ്ഞെടുക്കൂ.", postRequest: "സേവന അഭ്യർത്ഥന പോസ്റ്റ് ചെയ്യുക",
  step1Title: "ആവശ്യം അറിയിക്കുക", step1Body: "ഒരു മിനിറ്റിനുള്ളിൽ സേവനം തിരയുകയോ അഭ്യർത്ഥന പോസ്റ്റ് ചെയ്യുകയോ ചെയ്യൂ.",
  step2Title: "ഒരു പ്രൊഫഷണലിനെ തിരഞ്ഞെടുക്കുക", step2Body: "പ്രൊഫൈലുകൾ, നിരക്കുകൾ, പ്രവൃത്തികൾ, റിവ്യൂകൾ എന്നിവ താരതമ്യം ചെയ്യൂ.",
  step3Title: "ബുക്ക് ചെയ്ത് ആശ്വസിക്കൂ", step3Body: "അഭ്യർത്ഥന പിന്തുടർന്ന് തിരഞ്ഞെടുത്ത പ്രൊഫഷണലുമായി ബന്ധപ്പെടൂ.", growBusiness: "നിങ്ങളുടെ ബിസിനസ് വളർത്തൂ",
  professionalCta: "വിദഗ്ധ തൊഴിലാളിയാണോ? അടുത്ത ഉപഭോക്താവിനെ കണ്ടെത്തൂ.", professionalCtaBody: "സൗജന്യ പ്രൊഫൈൽ സൃഷ്ടിച്ച് നിങ്ങളുടെ പ്രവൃത്തികൾ കാണിക്കുകയും സമീപത്തെ അന്വേഷണങ്ങൾ സ്വീകരിക്കുകയും ചെയ്യൂ.",
  joinProfessional: "പ്രൊഫഷണലായി ചേരുക", discoverProfessionals: "പ്രൊഫഷണലുകളെ കണ്ടെത്തുക", findRightExpert: "സമീപത്തെ ശരിയായ വിദഗ്ധനെ കണ്ടെത്തൂ",
  allServices: "എല്ലാ സേവനങ്ങളും", searchPlaceholder: "സേവനം, പ്രൊവൈഡർ അല്ലെങ്കിൽ ബിസിനസ് തിരയുക", search: "തിരയുക", searchingNear: "തിരയുന്ന സ്ഥലം",
  change: "മാറ്റുക", filters: "ഫിൽട്ടറുകൾ", reset: "പുനഃസജ്ജമാക്കുക", distance: "ദൂരം", trustAvailability: "വിശ്വാസവും ലഭ്യതയും",
  verifiedOnly: "പരിശോധിച്ച പ്രൊവൈഡർമാർ മാത്രം", availableToday: "ഇന്ന് ലഭ്യമാണ്", emergencyService: "അടിയന്തര സേവനം", homeVisit: "വീട്ടിലെ സേവനം",
  minimumRating: "കുറഞ്ഞ റേറ്റിംഗ്", priceRange: "നിരക്ക് പരിധി", professionalsFound: "പ്രൊഫഷണലുകളെ കണ്ടെത്തി", within: "പരിധി", of: "—",
  recommended: "ശുപാർശ ചെയ്തത്", nearestFirst: "ഏറ്റവും സമീപത്തുള്ളത്", highestRated: "ഉയർന്ന റേറ്റിംഗ്", lowestPrice: "കുറഞ്ഞ നിരക്ക്",
  noProfessionals: "പ്രൊഫഷണലുകളെ കണ്ടെത്താനായില്ല", widenSearch: "ദൂരം കൂട്ടുകയോ ഫിൽട്ടറുകൾ കുറയ്ക്കുകയോ ചെയ്യൂ.", search60: "60 കി.മീ പരിധിയിൽ തിരയുക",
  completeDirectory: "സമ്പൂർണ്ണ ഡയറക്ടറി", chooseService: "സമീപത്തെ പ്രൊഫഷണലുകളെ കണ്ടെത്താൻ ഒരു സേവനം തിരഞ്ഞെടുക്കൂ.",
  viewProfile: "പ്രൊഫൈൽ കാണുക", requestService: "സേവനം അഭ്യർത്ഥിക്കുക", save: "സേവ് ചെയ്യുക", saved: "സേവ് ചെയ്തു", available: "ഇന്ന് ലഭ്യമാണ്",
  availabilityUnknown: "ലഭ്യത സ്ഥിരീകരിച്ചിട്ടില്ല", reviewed: "ഐഡിയും പ്രൊഫൈലും പരിശോധിച്ചു", newNearlio: "Nearleo-യിൽ പുതിയത്",
  noReviews: "ഇതുവരെ ഉപഭോക്തൃ റിവ്യൂകളില്ല", startsFrom: "ആരംഭ നിരക്ക്", askEstimate: "നിരക്ക് ചോദിക്കുക", noJobs: "പൂർത്തിയാക്കിയ ജോലികളില്ല",
  customers: "ഉപഭോക്താക്കൾ", safety: "സുരക്ഷ", professionals: "പ്രൊഫഷണലുകൾ", joinNearlio: "Nearleo-യിൽ ചേരുക", plansPricing: "പ്ലാനുകളും നിരക്കുകളും",
  providerHelp: "പ്രൊവൈഡർ സഹായം", company: "കമ്പനി", about: "ഞങ്ങളെക്കുറിച്ച്", contact: "ബന്ധപ്പെടുക", privacyTerms: "സ്വകാര്യതയും നിബന്ധനകളും",
  tagline: "പ്രാദേശിക വിദഗ്ധരും ഉപഭോക്താക്കളും കണ്ടുമുട്ടുന്ന ഇടം.", poweredBy: "സാങ്കേതിക പിന്തുണ", explore: "തിരയുക", requests: "അഭ്യർത്ഥനകൾ", inbox: "ഇൻബോക്സ്", account: "അക്കൗണ്ട്",
  exactMatch: "കൃത്യമായ പൊരുത്തം", suggestedService: "നിർദ്ദേശിച്ച സേവനം", languageLabel: "ഭാഷ",
  welcome: "Nearleo-യിലേക്ക് സ്വാഗതം", signInAccount: "നിങ്ങളുടെ അക്കൗണ്ടിൽ ലോഗിൻ ചെയ്യുക", createNearlioAccount: "Nearleo അക്കൗണ്ട് സൃഷ്ടിക്കുക",
  loginDescription: "ബുക്കിംഗുകളും നിരക്കുകളും സന്ദേശങ്ങളും സുരക്ഷിതമായി നിയന്ത്രിക്കുക.", registerDescription: "ഉപഭോക്താവായി ചേരുക അല്ലെങ്കിൽ സമീപത്തെ സേവന അന്വേഷണങ്ങൾ സ്വീകരിക്കുക.",
  createAccount: "അക്കൗണ്ട് സൃഷ്ടിക്കുക", fullName: "പൂർണ്ണ പേര്", emailAddress: "ഇമെയിൽ വിലാസം", mobileNumber: "മൊബൈൽ നമ്പർ", joinAs: "ഇങ്ങനെ ചേരണം",
  customerBook: "ഉപഭോക്താവ് — സേവനം ബുക്ക് ചെയ്യുക", providerReceive: "സേവന പ്രൊഫഷണൽ — ജോലി സ്വീകരിക്കുക", emailMobile: "ഇമെയിൽ അല്ലെങ്കിൽ മൊബൈൽ നമ്പർ", password: "പാസ്‌വേഡ്",
  passwordPlaceholder: "കുറഞ്ഞത് 8 അക്ഷരങ്ങൾ", passwordHint: "വലിയക്ഷരം, ചെറിയക്ഷരം, ഒരു അക്കമെങ്കിലും ഉപയോഗിക്കുക.",
  consent: "അനാവശ്യ സന്ദേശങ്ങളും ബന്ധപ്പെടാനുള്ള വിവരങ്ങളുടെ ദുരുപയോഗവും നിരോധിക്കുന്ന Nearleo ഉപയോക്തൃ നിബന്ധനകളും സ്വകാര്യതാ അറിയിപ്പും ഞാൻ അംഗീകരിക്കുന്നു.",
  readTerms: "നിബന്ധനകൾ വായിക്കുക", pleaseWait: "ദയവായി കാത്തിരിക്കുക…", agreeSignIn: "അംഗീകരിച്ച് ലോഗിൻ ചെയ്യുക", agreeCreate: "അംഗീകരിച്ച് അക്കൗണ്ട് സൃഷ്ടിക്കുക",
  passwordSecure: "നിങ്ങളുടെ പാസ്‌വേഡ് സുരക്ഷിതമായി ഹാഷ് ചെയ്യപ്പെടുന്നു; സാധാരണ ടെക്സ്റ്റായി സൂക്ഷിക്കില്ല.",
  nearleoStandard: "Nearleo നിലവാരം", trustTitle: "ഓരോ ഘട്ടത്തിലും വ്യക്തതയുള്ള പ്രാദേശിക സേവനങ്ങൾ.",
  browseFreely: "സ്വതന്ത്രമായി പരിശോധിക്കൂ", browseFreelyBody: "അക്കൗണ്ട് സൃഷ്ടിക്കുന്നതിന് മുമ്പ് പ്രസിദ്ധീകരിച്ച എല്ലാ പ്രൊഫഷണലുകളെയും കാണൂ.",
  privacyFirst: "സ്വകാര്യതയ്ക്ക് മുൻഗണന", privacyFirstBody: "പ്രൊവൈഡർ അനുമതി നൽകുന്നതുവരെ WhatsApp വിവരങ്ങൾ സ്വകാര്യമായി തുടരും.",
  verificationClarity: "വ്യക്തമായ വെരിഫിക്കേഷൻ", verificationClarityBody: "അഡ്മിൻ അംഗീകരിച്ച പ്രൊഫൈലുകൾക്ക് വ്യക്തമായ പച്ച ട്രസ്റ്റ് ബാഡ്ജ് ലഭിക്കും.",
  locationControl: "സ്ഥലം നിങ്ങളുടെ നിയന്ത്രണത്തിൽ", locationControlBody: "പ്രസക്തമായ പ്രാദേശിക വിദഗ്ധരെ കണ്ടെത്താൻ തിരയുന്ന സ്ഥലം എപ്പോൾ വേണമെങ്കിലും മാറ്റാം."
};

const hindi = withEnglish({
  home: "होम", findServices: "सेवाएँ खोजें", myRequests: "मेरे अनुरोध", messages: "संदेश",
  setLocation: "स्थान चुनें", forProfessionals: "पेशेवरों के लिए", signIn: "साइन इन",
  profileDashboard: "प्रोफ़ाइल और डैशबोर्ड", manageAccount: "अपना Nearleo खाता प्रबंधित करें", changeLocation: "स्थान बदलें",
  chooseSearchArea: "खोज क्षेत्र चुनें", logOut: "लॉग आउट", endSession: "इस सत्र को सुरक्षित रूप से समाप्त करें",
  trustedNearby: "भरोसेमंद पेशेवर, आपके आस-पास", heroTitle: "भरोसेमंद स्थानीय पेशेवर खोजें", nearYou: "आपके पास।",
  heroDescription: "छोटी मरम्मत से बड़े काम तक, अपनी हर जरूरत के लिए सही स्थानीय विशेषज्ञ खोजें।",
  service: "सेवा", servicePlaceholder: "प्लंबर, इलेक्ट्रीशियन, बढ़ई…", yourLocation: "आपका स्थान", radius: "दूरी",
  searchNow: "अभी खोजें", exploreServices: "सेवाएँ देखें", needHelp: "आपको किस सेवा की जरूरत है?", viewAllServices: "सभी सेवाएँ देखें",
  browseService: "सेवा देखें", topNearby: "आपके पास के प्रमुख पेशेवर", seeAllProfessionals: "सभी पेशेवर देखें",
  noProviders: "अभी कोई प्रोफ़ाइल प्रकाशित नहीं हुई", providersSoon: "प्रोफ़ाइल पूरी करने वाले नए पेशेवर यहाँ दिखाई देंगे।",
  simpleSecure: "सरल और सुरक्षित", easyTitle: "खोज से सेवा तक, सब कुछ आसान।", postRequest: "सेवा अनुरोध पोस्ट करें",
  step1Title: "अपनी जरूरत बताएं", step2Title: "पेशेवर चुनें", step3Title: "अनुरोध भेजें और जुड़ें",
  growBusiness: "अपना व्यवसाय बढ़ाएँ", joinProfessional: "पेशेवर के रूप में जुड़ें", discoverProfessionals: "पेशेवर खोजें",
  findRightExpert: "पास में सही विशेषज्ञ खोजें", allServices: "सभी सेवाएँ", searchPlaceholder: "सेवा, प्रदाता या व्यवसाय खोजें",
  search: "खोजें", searchingNear: "इस स्थान के पास", change: "बदलें", filters: "फ़िल्टर", reset: "रीसेट", distance: "दूरी",
  trustAvailability: "भरोसा और उपलब्धता", verifiedOnly: "केवल सत्यापित प्रदाता", availableToday: "आज उपलब्ध",
  professionalsFound: "पेशेवर मिले", recommended: "सुझाए गए", nearestFirst: "सबसे पास पहले", highestRated: "सबसे अच्छी रेटिंग",
  lowestPrice: "सबसे कम कीमत", noProfessionals: "कोई पेशेवर नहीं मिला", widenSearch: "दूरी बढ़ाएँ या फ़िल्टर कम करें।",
  completeDirectory: "पूरी सेवा सूची", chooseService: "अपने पास के पेशेवर खोजने के लिए सेवा चुनें।",
  viewProfile: "प्रोफ़ाइल देखें", requestService: "सेवा का अनुरोध करें", save: "सहेजें", saved: "सहेजा गया", available: "आज उपलब्ध",
  customers: "ग्राहक", safety: "सुरक्षा", professionals: "पेशेवर", plansPricing: "योजनाएँ और मूल्य", company: "कंपनी",
  about: "हमारे बारे में", contact: "संपर्क", privacyTerms: "गोपनीयता और शर्तें", explore: "खोजें", requests: "अनुरोध",
  inbox: "इनबॉक्स", account: "खाता", exactMatch: "सटीक मिलान", suggestedService: "सुझाई गई सेवा", languageLabel: "भाषा",
  welcome: "Nearleo में आपका स्वागत है", signInAccount: "अपने खाते में साइन इन करें", createNearlioAccount: "Nearleo खाता बनाएँ",
  createAccount: "खाता बनाएँ", fullName: "पूरा नाम", emailAddress: "ईमेल पता", mobileNumber: "मोबाइल नंबर",
  emailMobile: "ईमेल या मोबाइल नंबर", password: "पासवर्ड", pleaseWait: "कृपया प्रतीक्षा करें…", agreeSignIn: "सहमत होकर साइन इन करें",
  agreeCreate: "सहमत होकर खाता बनाएँ", readTerms: "शर्तें पढ़ें"
});

const tamil = withEnglish({
  home: "முகப்பு", findServices: "சேவைகளைத் தேடுங்கள்", myRequests: "என் கோரிக்கைகள்", messages: "செய்திகள்",
  setLocation: "இடத்தைத் தேர்வுசெய்க", forProfessionals: "தொழில் நிபுணர்களுக்கு", signIn: "உள்நுழைக",
  profileDashboard: "சுயவிவரம் மற்றும் டாஷ்போர்டு", manageAccount: "Nearleo கணக்கை நிர்வகிக்கவும்", changeLocation: "இடத்தை மாற்றுக",
  chooseSearchArea: "தேடல் பகுதியைத் தேர்வுசெய்க", logOut: "வெளியேறு", endSession: "இந்த அமர்வை பாதுகாப்பாக முடிக்கவும்",
  trustedNearby: "நம்பகமான நிபுணர்கள் உங்கள் அருகில்", heroTitle: "நம்பகமான உள்ளூர் நிபுணர்களைக் கண்டறியுங்கள்", nearYou: "உங்கள் அருகில்.",
  heroDescription: "சிறிய பழுதுபார்ப்பிலிருந்து பெரிய வேலைகள் வரை, தேவையான உள்ளூர் நிபுணரைக் கண்டறியுங்கள்.",
  service: "சேவை", servicePlaceholder: "பிளம்பர், எலக்ட்ரீஷியன், தச்சர்…", yourLocation: "உங்கள் இடம்", radius: "தூரம்",
  searchNow: "இப்போது தேடுங்கள்", exploreServices: "சேவைகளைப் பாருங்கள்", needHelp: "எந்த சேவை தேவை?", viewAllServices: "அனைத்து சேவைகளும்",
  browseService: "சேவையைப் பாருங்கள்", topNearby: "அருகிலுள்ள சிறந்த நிபுணர்கள்", seeAllProfessionals: "அனைத்து நிபுணர்களும்",
  noProviders: "இன்னும் சுயவிவரங்கள் வெளியிடப்படவில்லை", providersSoon: "சுயவிவரத்தை நிறைவு செய்யும் புதிய நிபுணர்கள் இங்கே தோன்றுவார்கள்.",
  simpleSecure: "எளிமை மற்றும் பாதுகாப்பு", easyTitle: "தேடலிலிருந்து சேவை வரை அனைத்தும் எளிது.", postRequest: "சேவை கோரிக்கையை இடுங்கள்",
  step1Title: "தேவையைச் சொல்லுங்கள்", step2Title: "நிபுணரைத் தேர்வுசெய்க", step3Title: "கோரிக்கையை அனுப்பி இணையுங்கள்",
  growBusiness: "உங்கள் தொழிலை வளருங்கள்", joinProfessional: "நிபுணராக இணையுங்கள்", discoverProfessionals: "நிபுணர்களைக் கண்டறியுங்கள்",
  findRightExpert: "அருகிலுள்ள சரியான நிபுணரைக் கண்டறியுங்கள்", allServices: "அனைத்து சேவைகள்", searchPlaceholder: "சேவை, வழங்குநர் அல்லது நிறுவனத்தைத் தேடுங்கள்",
  search: "தேடுக", searchingNear: "இந்த இடத்திற்கு அருகில்", change: "மாற்றுக", filters: "வடிகட்டிகள்", reset: "மீட்டமை", distance: "தூரம்",
  trustAvailability: "நம்பிக்கை மற்றும் கிடைப்புத்தன்மை", verifiedOnly: "சரிபார்க்கப்பட்ட வழங்குநர்கள் மட்டும்", availableToday: "இன்று கிடைக்கும்",
  professionalsFound: "நிபுணர்கள் கிடைத்தனர்", recommended: "பரிந்துரைக்கப்பட்டது", nearestFirst: "அருகிலுள்ளது முதலில்", highestRated: "அதிக மதிப்பீடு",
  lowestPrice: "குறைந்த விலை", noProfessionals: "நிபுணர்கள் கிடைக்கவில்லை", widenSearch: "தூரத்தை அதிகரிக்கவும் அல்லது வடிகட்டிகளை குறைக்கவும்.",
  completeDirectory: "முழு சேவை பட்டியல்", chooseService: "அருகிலுள்ள நிபுணர்களைக் காண ஒரு சேவையைத் தேர்வுசெய்க.",
  viewProfile: "சுயவிவரம் பார்க்க", requestService: "சேவையை கோருங்கள்", save: "சேமி", saved: "சேமிக்கப்பட்டது", available: "இன்று கிடைக்கும்",
  customers: "வாடிக்கையாளர்கள்", safety: "பாதுகாப்பு", professionals: "நிபுணர்கள்", plansPricing: "திட்டங்கள் மற்றும் விலை", company: "நிறுவனம்",
  about: "எங்களைப் பற்றி", contact: "தொடர்பு", privacyTerms: "தனியுரிமை மற்றும் விதிமுறைகள்", explore: "தேடுங்கள்", requests: "கோரிக்கைகள்",
  inbox: "இன்பாக்ஸ்", account: "கணக்கு", exactMatch: "சரியான பொருத்தம்", suggestedService: "பரிந்துரைக்கப்பட்ட சேவை", languageLabel: "மொழி",
  welcome: "Nearleo-க்கு வரவேற்கிறோம்", signInAccount: "உங்கள் கணக்கில் உள்நுழைக", createNearlioAccount: "Nearleo கணக்கை உருவாக்குக",
  createAccount: "கணக்கை உருவாக்குக", fullName: "முழுப் பெயர்", emailAddress: "மின்னஞ்சல் முகவரி", mobileNumber: "மொபைல் எண்",
  emailMobile: "மின்னஞ்சல் அல்லது மொபைல் எண்", password: "கடவுச்சொல்", pleaseWait: "தயவுசெய்து காத்திருக்கவும்…", agreeSignIn: "ஒப்புக்கொண்டு உள்நுழைக",
  agreeCreate: "ஒப்புக்கொண்டு கணக்கை உருவாக்குக", readTerms: "விதிமுறைகளைப் படிக்கவும்"
});

const kannada = withEnglish({
  home: "ಮುಖಪುಟ", findServices: "ಸೇವೆಗಳನ್ನು ಹುಡುಕಿ", myRequests: "ನನ್ನ ವಿನಂತಿಗಳು", messages: "ಸಂದೇಶಗಳು",
  setLocation: "ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ", forProfessionals: "ವೃತ್ತಿಪರರಿಗಾಗಿ", signIn: "ಸೈನ್ ಇನ್",
  profileDashboard: "ಪ್ರೊಫೈಲ್ ಮತ್ತು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", manageAccount: "ನಿಮ್ಮ Nearleo ಖಾತೆಯನ್ನು ನಿರ್ವಹಿಸಿ", changeLocation: "ಸ್ಥಳ ಬದಲಿಸಿ",
  chooseSearchArea: "ಹುಡುಕಾಟದ ಪ್ರದೇಶ ಆಯ್ಕೆಮಾಡಿ", logOut: "ಲಾಗ್ ಔಟ್", endSession: "ಈ ಸೆಷನ್ ಅನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಮುಗಿಸಿ",
  trustedNearby: "ವಿಶ್ವಾಸಾರ್ಹ ವೃತ್ತಿಪರರು ನಿಮ್ಮ ಹತ್ತಿರ", heroTitle: "ವಿಶ್ವಾಸಾರ್ಹ ಸ್ಥಳೀಯ ವೃತ್ತಿಪರರನ್ನು ಹುಡುಕಿ", nearYou: "ನಿಮ್ಮ ಹತ್ತಿರ.",
  heroDescription: "ಸಣ್ಣ ದುರಸ್ತಿಯಿಂದ ದೊಡ್ಡ ಕೆಲಸದವರೆಗೆ, ನಿಮಗೆ ಬೇಕಾದ ಸ್ಥಳೀಯ ತಜ್ಞರನ್ನು ಹುಡುಕಿ.",
  service: "ಸೇವೆ", servicePlaceholder: "ಪ್ಲಂಬರ್, ಎಲೆಕ್ಟ್ರಿಷಿಯನ್, ಕಾರ್ಪೆಂಟರ್…", yourLocation: "ನಿಮ್ಮ ಸ್ಥಳ", radius: "ದೂರ",
  searchNow: "ಈಗ ಹುಡುಕಿ", exploreServices: "ಸೇವೆಗಳನ್ನು ನೋಡಿ", needHelp: "ಯಾವ ಸೇವೆ ಬೇಕು?", viewAllServices: "ಎಲ್ಲಾ ಸೇವೆಗಳನ್ನು ನೋಡಿ",
  browseService: "ಸೇವೆ ನೋಡಿ", topNearby: "ಹತ್ತಿರದ ಪ್ರಮುಖ ವೃತ್ತಿಪರರು", seeAllProfessionals: "ಎಲ್ಲಾ ವೃತ್ತಿಪರರನ್ನು ನೋಡಿ",
  noProviders: "ಇನ್ನೂ ಯಾವುದೇ ಪ್ರೊಫೈಲ್ ಪ್ರಕಟವಾಗಿಲ್ಲ", providersSoon: "ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸುವ ಹೊಸ ವೃತ್ತಿಪರರು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತಾರೆ.",
  simpleSecure: "ಸರಳ ಮತ್ತು ಸುರಕ್ಷಿತ", easyTitle: "ಹುಡುಕಾಟದಿಂದ ಸೇವೆಯವರೆಗೆ ಎಲ್ಲವೂ ಸುಲಭ.", postRequest: "ಸೇವಾ ವಿನಂತಿ ಪೋಸ್ಟ್ ಮಾಡಿ",
  step1Title: "ನಿಮ್ಮ ಅಗತ್ಯ ತಿಳಿಸಿ", step2Title: "ವೃತ್ತಿಪರರನ್ನು ಆಯ್ಕೆಮಾಡಿ", step3Title: "ವಿನಂತಿ ಕಳುಹಿಸಿ ಸಂಪರ್ಕಿಸಿ",
  growBusiness: "ನಿಮ್ಮ ವ್ಯವಹಾರ ಬೆಳೆಸಿ", joinProfessional: "ವೃತ್ತಿಪರರಾಗಿ ಸೇರಿ", discoverProfessionals: "ವೃತ್ತಿಪರರನ್ನು ಹುಡುಕಿ",
  findRightExpert: "ಹತ್ತಿರದ ಸರಿಯಾದ ತಜ್ಞರನ್ನು ಹುಡುಕಿ", allServices: "ಎಲ್ಲಾ ಸೇವೆಗಳು", searchPlaceholder: "ಸೇವೆ, ಪೂರೈಕೆದಾರ ಅಥವಾ ವ್ಯವಹಾರ ಹುಡುಕಿ",
  search: "ಹುಡುಕಿ", searchingNear: "ಈ ಸ್ಥಳದ ಹತ್ತಿರ", change: "ಬದಲಿಸಿ", filters: "ಫಿಲ್ಟರ್‌ಗಳು", reset: "ಮರುಹೊಂದಿಸಿ", distance: "ದೂರ",
  trustAvailability: "ವಿಶ್ವಾಸ ಮತ್ತು ಲಭ್ಯತೆ", verifiedOnly: "ಪರಿಶೀಲಿಸಿದ ಪೂರೈಕೆದಾರರು ಮಾತ್ರ", availableToday: "ಇಂದು ಲಭ್ಯ",
  professionalsFound: "ವೃತ್ತಿಪರರು ಸಿಕ್ಕಿದ್ದಾರೆ", recommended: "ಶಿಫಾರಸು", nearestFirst: "ಹತ್ತಿರದವರು ಮೊದಲು", highestRated: "ಅತ್ಯಧಿಕ ರೇಟಿಂಗ್",
  lowestPrice: "ಕಡಿಮೆ ಬೆಲೆ", noProfessionals: "ವೃತ್ತಿಪರರು ಸಿಗಲಿಲ್ಲ", widenSearch: "ದೂರ ಹೆಚ್ಚಿಸಿ ಅಥವಾ ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಕಡಿಮೆ ಮಾಡಿ.",
  completeDirectory: "ಸಂಪೂರ್ಣ ಸೇವಾ ಪಟ್ಟಿ", chooseService: "ಹತ್ತಿರದ ವೃತ್ತಿಪರರನ್ನು ಹುಡುಕಲು ಸೇವೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
  viewProfile: "ಪ್ರೊಫೈಲ್ ನೋಡಿ", requestService: "ಸೇವೆ ವಿನಂತಿಸಿ", save: "ಉಳಿಸಿ", saved: "ಉಳಿಸಲಾಗಿದೆ", available: "ಇಂದು ಲಭ್ಯ",
  customers: "ಗ್ರಾಹಕರು", safety: "ಸುರಕ್ಷತೆ", professionals: "ವೃತ್ತಿಪರರು", plansPricing: "ಯೋಜನೆಗಳು ಮತ್ತು ಬೆಲೆ", company: "ಕಂಪನಿ",
  about: "ನಮ್ಮ ಬಗ್ಗೆ", contact: "ಸಂಪರ್ಕ", privacyTerms: "ಗೌಪ್ಯತೆ ಮತ್ತು ನಿಯಮಗಳು", explore: "ಹುಡುಕಿ", requests: "ವಿನಂತಿಗಳು",
  inbox: "ಇನ್‌ಬಾಕ್ಸ್", account: "ಖಾತೆ", exactMatch: "ನಿಖರ ಹೊಂದಾಣಿಕೆ", suggestedService: "ಸೂಚಿಸಿದ ಸೇವೆ", languageLabel: "ಭಾಷೆ",
  welcome: "Nearleoಗೆ ಸ್ವಾಗತ", signInAccount: "ನಿಮ್ಮ ಖಾತೆಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ", createNearlioAccount: "Nearleo ಖಾತೆ ರಚಿಸಿ",
  createAccount: "ಖಾತೆ ರಚಿಸಿ", fullName: "ಪೂರ್ಣ ಹೆಸರು", emailAddress: "ಇಮೇಲ್ ವಿಳಾಸ", mobileNumber: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
  emailMobile: "ಇಮೇಲ್ ಅಥವಾ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ", password: "ಪಾಸ್‌ವರ್ಡ್", pleaseWait: "ದಯವಿಟ್ಟು ಕಾಯಿರಿ…", agreeSignIn: "ಒಪ್ಪಿಕೊಂಡು ಸೈನ್ ಇನ್ ಮಾಡಿ",
  agreeCreate: "ಒಪ್ಪಿಕೊಂಡು ಖಾತೆ ರಚಿಸಿ", readTerms: "ನಿಯಮಗಳನ್ನು ಓದಿ"
});

const telugu = withEnglish({
  home: "హోమ్", findServices: "సేవలను వెతకండి", myRequests: "నా అభ్యర్థనలు", messages: "సందేశాలు",
  setLocation: "స్థలాన్ని ఎంచుకోండి", forProfessionals: "వృత్తి నిపుణుల కోసం", signIn: "సైన్ ఇన్",
  profileDashboard: "ప్రొఫైల్ మరియు డ్యాష్‌బోర్డ్", manageAccount: "మీ Nearleo ఖాతాను నిర్వహించండి", changeLocation: "స్థలం మార్చండి",
  chooseSearchArea: "వెతకాల్సిన ప్రాంతాన్ని ఎంచుకోండి", logOut: "లాగ్ అవుట్", endSession: "ఈ సెషన్‌ను సురక్షితంగా ముగించండి",
  trustedNearby: "నమ్మకమైన నిపుణులు మీ సమీపంలో", heroTitle: "నమ్మకమైన స్థానిక నిపుణులను కనుగొనండి", nearYou: "మీ సమీపంలో.",
  heroDescription: "చిన్న మరమ్మతుల నుంచి పెద్ద పనుల వరకు, మీకు కావలసిన స్థానిక నిపుణులను కనుగొనండి.",
  service: "సేవ", servicePlaceholder: "ప్లంబర్, ఎలక్ట్రిషియన్, కార్పెంటర్…", yourLocation: "మీ స్థలం", radius: "దూరం",
  searchNow: "ఇప్పుడే వెతకండి", exploreServices: "సేవలను చూడండి", needHelp: "మీకు ఏ సేవ కావాలి?", viewAllServices: "అన్ని సేవలను చూడండి",
  browseService: "సేవను చూడండి", topNearby: "సమీపంలోని ప్రముఖ నిపుణులు", seeAllProfessionals: "అన్ని నిపుణులను చూడండి",
  noProviders: "ఇంకా ఎలాంటి ప్రొఫైళ్లు ప్రచురించలేదు", providersSoon: "ప్రొఫైల్ పూర్తి చేసిన కొత్త నిపుణులు ఇక్కడ కనిపిస్తారు.",
  simpleSecure: "సులభం మరియు సురక్షితం", easyTitle: "వెతకడం నుంచి సేవ వరకు అన్నీ సులభం.", postRequest: "సేవ అభ్యర్థనను పోస్ట్ చేయండి",
  step1Title: "మీ అవసరాన్ని చెప్పండి", step2Title: "నిపుణుడిని ఎంచుకోండి", step3Title: "అభ్యర్థన పంపి కలవండి",
  growBusiness: "మీ వ్యాపారాన్ని పెంచుకోండి", joinProfessional: "నిపుణుడిగా చేరండి", discoverProfessionals: "నిపుణులను కనుగొనండి",
  findRightExpert: "సమీపంలో సరైన నిపుణుడిని కనుగొనండి", allServices: "అన్ని సేవలు", searchPlaceholder: "సేవ, ప్రొవైడర్ లేదా వ్యాపారాన్ని వెతకండి",
  search: "వెతకండి", searchingNear: "ఈ ప్రాంతం దగ్గర", change: "మార్చండి", filters: "ఫిల్టర్లు", reset: "రీసెట్", distance: "దూరం",
  trustAvailability: "నమ్మకం మరియు లభ్యత", verifiedOnly: "ధృవీకరించిన ప్రొవైడర్లు మాత్రమే", availableToday: "ఈ రోజు అందుబాటులో",
  professionalsFound: "నిపుణులు దొరికారు", recommended: "సిఫార్సు", nearestFirst: "సమీపంలో ఉన్నవారు ముందు", highestRated: "అత్యధిక రేటింగ్",
  lowestPrice: "తక్కువ ధర", noProfessionals: "నిపుణులు దొరకలేదు", widenSearch: "దూరాన్ని పెంచండి లేదా ఫిల్టర్లను తగ్గించండి.",
  completeDirectory: "పూర్తి సేవల జాబితా", chooseService: "సమీపంలోని నిపుణులను కనుగొనడానికి సేవను ఎంచుకోండి.",
  viewProfile: "ప్రొఫైల్ చూడండి", requestService: "సేవను అభ్యర్థించండి", save: "సేవ్", saved: "సేవ్ అయింది", available: "ఈ రోజు అందుబాటులో",
  customers: "కస్టమర్లు", safety: "భద్రత", professionals: "నిపుణులు", plansPricing: "ప్లాన్లు మరియు ధరలు", company: "కంపెనీ",
  about: "మా గురించి", contact: "సంప్రదించండి", privacyTerms: "గోప్యత మరియు నిబంధనలు", explore: "వెతకండి", requests: "అభ్యర్థనలు",
  inbox: "ఇన్‌బాక్స్", account: "ఖాతా", exactMatch: "ఖచ్చితమైన సరిపోలిక", suggestedService: "సూచించిన సేవ", languageLabel: "భాష",
  welcome: "Nearleoకు స్వాగతం", signInAccount: "మీ ఖాతాలో సైన్ ఇన్ చేయండి", createNearlioAccount: "Nearleo ఖాతాను సృష్టించండి",
  createAccount: "ఖాతాను సృష్టించండి", fullName: "పూర్తి పేరు", emailAddress: "ఇమెయిల్ చిరునామా", mobileNumber: "మొబైల్ నంబర్",
  emailMobile: "ఇమెయిల్ లేదా మొబైల్ నంబర్", password: "పాస్‌వర్డ్", pleaseWait: "దయచేసి వేచి ఉండండి…", agreeSignIn: "అంగీకరించి సైన్ ఇన్ చేయండి",
  agreeCreate: "అంగీకరించి ఖాతాను సృష్టించండి", readTerms: "నిబంధనలు చదవండి"
});

export const translations = { EN: english, ML: malayalam, HI: hindi, TA: tamil, KN: kannada, TE: telugu } as const;
export type Language = keyof typeof translations;
export type Translation = TranslationTable;

export const languageOptions: ReadonlyArray<{ code: Language; label: string; lang: string }> = [
  { code: "EN", label: "English", lang: "en" },
  { code: "ML", label: "മലയാളം", lang: "ml" },
  { code: "HI", label: "हिन्दी", lang: "hi" },
  { code: "TA", label: "தமிழ்", lang: "ta" },
  { code: "KN", label: "ಕನ್ನಡ", lang: "kn" },
  { code: "TE", label: "తెలుగు", lang: "te" },
];

export const malayalamServiceNames: Record<string, string> = {
  "Plumber":"പ്ലംബർ", "Electrician":"ഇലക്ട്രീഷ്യൻ", "Carpenter":"കാർപെന്റർ", "Mason":"മേസ്തിരി", "Interlock paving":"ഇന്റർലോക്ക് പാവിംഗ്",
  "Hollow-brick work":"ഹോളോ ബ്രിക്ക് വർക്ക്", "Painter":"പെയിന്റർ", "Plastering worker":"പ്ലാസ്റ്ററിംഗ് തൊഴിലാളി", "Tile worker":"ടൈൽ തൊഴിലാളി",
  "Marble and granite worker":"മാർബിൾ, ഗ്രാനൈറ്റ് തൊഴിലാളി", "Flooring specialist":"ഫ്ലോറിംഗ് വിദഗ്ധൻ", "False-ceiling worker":"ഫാൾസ് സീലിംഗ് തൊഴിലാളി",
  "Welder":"വെൽഡർ", "Fabrication worker":"ഫാബ്രിക്കേഷൻ തൊഴിലാളി", "Aluminium fabricator":"അലുമിനിയം ഫാബ്രിക്കേറ്റർ", "Glass worker":"ഗ്ലാസ് തൊഴിലാളി",
  "Roofing worker":"റൂഫിംഗ് തൊഴിലാളി", "Waterproofing specialist":"വാട്ടർപ്രൂഫിംഗ് വിദഗ്ധൻ", "Interior designer":"ഇന്റീരിയർ ഡിസൈനർ",
  "Interior work contractor":"ഇന്റീരിയർ വർക്ക് കോൺട്രാക്ടർ", "Civil contractor":"സിവിൽ കോൺട്രാക്ടർ", "Building contractor":"ബിൽഡിംഗ് കോൺട്രാക്ടർ",
  "Architect":"ആർക്കിടെക്റ്റ്", "Structural engineer":"സ്ട്രക്ചറൽ എൻജിനീയർ", "Surveyor":"സർവേയർ", "Home renovation contractor":"ഹോം റിനോവേഷൻ കോൺട്രാക്ടർ",
  "Demolition worker":"പൊളിക്കൽ തൊഴിലാളി", "Borewell service":"ബോർവെൽ സേവനം", "Water-tank cleaning":"വാട്ടർ ടാങ്ക് ക്ലീനിംഗ്", "Drain cleaning":"ഡ്രെയിൻ ക്ലീനിംഗ്",
  "Septic-tank cleaning":"സെപ്റ്റിക് ടാങ്ക് ക്ലീനിംഗ്", "Pest-control service":"പെസ്റ്റ് കൺട്രോൾ", "House-cleaning service":"വീട് വൃത്തിയാക്കൽ",
  "Office-cleaning service":"ഓഫീസ് വൃത്തിയാക്കൽ", "Sofa and carpet cleaning":"സോഫ, കാർപ്പറ്റ് ക്ലീനിംഗ്", "Gardening and landscaping":"ഗാർഡനിംഗ്, ലാൻഡ്സ്കേപ്പിംഗ്",
  "Tree cutting":"മരം മുറിക്കൽ", "Lawn maintenance":"ലോൺ പരിപാലനം", "Security guard":"സെക്യൂരിറ്റി ഗാർഡ്", "CCTV installation":"സിസിടിവി ഇൻസ്റ്റലേഷൻ",
  "Home-automation technician":"ഹോം ഓട്ടോമേഷൻ ടെക്നീഷ്യൻ", "Appliance repair":"ഗൃഹോപകരണ റിപ്പയർ", "Refrigerator repair":"ഫ്രിഡ്ജ് റിപ്പയർ",
  "Washing-machine repair":"വാഷിംഗ് മെഷീൻ റിപ്പയർ", "Air-conditioner installation and repair":"എസി ഇൻസ്റ്റലേഷനും റിപ്പയറും", "Television repair":"ടിവി റിപ്പയർ",
  "Computer and laptop repair":"കമ്പ്യൂട്ടർ, ലാപ്ടോപ്പ് റിപ്പയർ", "Mobile-phone repair":"മൊബൈൽ ഫോൺ റിപ്പയർ", "Inverter and UPS service":"ഇൻവെർട്ടർ, യുപിഎസ് സേവനം",
  "Solar-panel installation and service":"സോളാർ പാനൽ സേവനം", "Generator service":"ജനറേറ്റർ സേവനം", "Internet and Wi-Fi technician":"ഇന്റർനെറ്റ്, വൈ-ഫൈ ടെക്നീഷ്യൻ",
  "DTH and antenna installation":"ഡിടിഎച്ച്, ആന്റിന ഇൻസ്റ്റലേഷൻ", "RO and water-purifier service":"വാട്ടർ പ്യൂരിഫയർ സേവനം", "Mechanic":"മെക്കാനിക്",
  "Car mechanic":"കാർ മെക്കാനിക്", "Bike mechanic":"ബൈക്ക് മെക്കാനിക്", "Car wash":"കാർ വാഷ്", "Vehicle towing":"വാഹന ടോയിംഗ്", "Driver":"ഡ്രൈവർ",
  "Taxi service":"ടാക്സി സേവനം", "Goods-vehicle service":"ചരക്ക് വാഹന സേവനം", "Packers and movers":"പാക്കേഴ്സ് ആൻഡ് മൂവേഴ്സ്", "Delivery service":"ഡെലിവറി സേവനം",
  "Photographer":"ഫോട്ടോഗ്രാഫർ", "Videographer":"വീഡിയോഗ്രാഫർ", "Drone photographer":"ഡ്രോൺ ഫോട്ടോഗ്രാഫർ", "Wedding photographer":"വിവാഹ ഫോട്ടോഗ്രാഫർ",
  "Photo and video editor":"ഫോട്ടോ, വീഡിയോ എഡിറ്റർ", "Event planner":"ഇവന്റ് പ്ലാനർ", "Wedding decorator":"വിവാഹ ഡെക്കറേറ്റർ", "Stage decorator":"സ്റ്റേജ് ഡെക്കറേറ്റർ",
  "Catering service":"കേറ്ററിംഗ് സേവനം", "Cook or chef":"പാചകക്കാരൻ / ഷെഫ്", "Makeup artist":"മേക്കപ്പ് ആർട്ടിസ്റ്റ്", "Beautician":"ബ്യൂട്ടീഷ്യൻ",
  "Hair stylist":"ഹെയർ സ്റ്റൈലിസ്റ്റ്", "Mehendi artist":"മെഹന്തി ആർട്ടിസ്റ്റ്", "Tailor":"ടെയ്‌ലർ", "Laundry and ironing":"ലോണ്ട്രി, ഇസ്തിരി",
  "Babysitter":"ബേബിസിറ്റർ", "Elder-care assistant":"വയോജന പരിചരണ സഹായി", "Home nurse":"ഹോം നഴ്സ്", "Physiotherapist":"ഫിസിയോതെറാപ്പിസ്റ്റ്",
  "Fitness trainer":"ഫിറ്റ്നസ് ട്രെയിനർ", "Yoga trainer":"യോഗ ട്രെയിനർ", "Tutor":"ട്യൂട്ടർ", "Music teacher":"സംഗീത അധ്യാപകൻ", "Dance teacher":"നൃത്ത അധ്യാപകൻ",
  "Language teacher":"ഭാഷാ അധ്യാപകൻ", "Graphic designer":"ഗ്രാഫിക് ഡിസൈനർ", "Web developer":"വെബ് ഡെവലപ്പർ", "Digital marketing professional":"ഡിജിറ്റൽ മാർക്കറ്റിംഗ് വിദഗ്ധൻ",
  "Accountant":"അക്കൗണ്ടന്റ്", "Tax consultant":"നികുതി ഉപദേഷ്ടാവ്", "Legal consultant":"നിയമ ഉപദേഷ്ടാവ്", "Document-writing service":"ഡോക്യുമെന്റ് റൈറ്റിംഗ് സേവനം",
  "Printing service":"പ്രിന്റിംഗ് സേവനം", "Signboard maker":"സൈൻബോർഡ് നിർമ്മാതാവ്", "Other local services":"മറ്റ് പ്രാദേശിക സേവനങ്ങൾ", "All services":"എല്ലാ സേവനങ്ങളും"
};

const hindiServiceNames: Record<string, string> = {
  "Plumber":"प्लंबर", "Electrician":"इलेक्ट्रीशियन", "Carpenter":"बढ़ई", "Mason":"राजमिस्त्री", "Interlock paving":"इंटरलॉक पेविंग",
  "Hollow-brick work":"हॉलो ब्रिक का काम", "Painter":"पेंटर", "Plastering worker":"प्लास्टर कारीगर", "Tile worker":"टाइल कारीगर",
  "House-cleaning service":"घर की सफाई", "Air-conditioner installation and repair":"एसी इंस्टॉलेशन और मरम्मत", "Appliance repair":"उपकरण मरम्मत",
  "Mechanic":"मैकेनिक", "Car mechanic":"कार मैकेनिक", "Photographer":"फोटोग्राफर", "CCTV installation":"सीसीटीवी इंस्टॉलेशन",
  "Home nurse":"होम नर्स", "Tutor":"ट्यूटर", "Web developer":"वेब डेवलपर", "Other local services":"अन्य स्थानीय सेवाएँ", "All services":"सभी सेवाएँ"
};

const tamilServiceNames: Record<string, string> = {
  "Plumber":"பிளம்பர்", "Electrician":"எலக்ட்ரீஷியன்", "Carpenter":"தச்சர்", "Mason":"கொத்தனார்", "Interlock paving":"இன்டர்லாக் பதித்தல்",
  "Hollow-brick work":"ஹாலோ பிரிக் வேலை", "Painter":"பெயிண்டர்", "Plastering worker":"பூச்சு வேலை செய்பவர்", "Tile worker":"டைல் வேலை செய்பவர்",
  "House-cleaning service":"வீடு சுத்தம் செய்யும் சேவை", "Air-conditioner installation and repair":"ஏசி நிறுவல் மற்றும் பழுதுபார்ப்பு", "Appliance repair":"வீட்டு உபகரண பழுதுபார்ப்பு",
  "Mechanic":"மெக்கானிக்", "Car mechanic":"கார் மெக்கானிக்", "Photographer":"புகைப்படக் கலைஞர்", "CCTV installation":"சிசிடிவி நிறுவல்",
  "Home nurse":"வீட்டு செவிலியர்", "Tutor":"தனிப்பயிற்சி ஆசிரியர்", "Web developer":"வலைத்தள உருவாக்குநர்", "Other local services":"மற்ற உள்ளூர் சேவைகள்", "All services":"அனைத்து சேவைகள்"
};

const kannadaServiceNames: Record<string, string> = {
  "Plumber":"ಪ್ಲಂಬರ್", "Electrician":"ಎಲೆಕ್ಟ್ರಿಷಿಯನ್", "Carpenter":"ಬಡಗಿ", "Mason":"ಗಾರೆ ಕೆಲಸಗಾರ", "Interlock paving":"ಇಂಟರ್‌ಲಾಕ್ ಪೇವಿಂಗ್",
  "Hollow-brick work":"ಹಾಲೋ ಬ್ರಿಕ್ ಕೆಲಸ", "Painter":"ಪೇಂಟರ್", "Plastering worker":"ಪ್ಲಾಸ್ಟರಿಂಗ್ ಕೆಲಸಗಾರ", "Tile worker":"ಟೈಲ್ ಕೆಲಸಗಾರ",
  "House-cleaning service":"ಮನೆ ಸ್ವಚ್ಛತಾ ಸೇವೆ", "Air-conditioner installation and repair":"ಎಸಿ ಅಳವಡಿಕೆ ಮತ್ತು ದುರಸ್ತಿ", "Appliance repair":"ಗೃಹೋಪಕರಣ ದುರಸ್ತಿ",
  "Mechanic":"ಮೆಕ್ಯಾನಿಕ್", "Car mechanic":"ಕಾರ್ ಮೆಕ್ಯಾನಿಕ್", "Photographer":"ಛಾಯಾಗ್ರಾಹಕ", "CCTV installation":"ಸಿಸಿಟಿವಿ ಅಳವಡಿಕೆ",
  "Home nurse":"ಹೋಮ್ ನರ್ಸ್", "Tutor":"ಬೋಧಕರು", "Web developer":"ವೆಬ್ ಡೆವಲಪರ್", "Other local services":"ಇತರೆ ಸ್ಥಳೀಯ ಸೇವೆಗಳು", "All services":"ಎಲ್ಲಾ ಸೇವೆಗಳು"
};

const teluguServiceNames: Record<string, string> = {
  "Plumber":"ప్లంబర్", "Electrician":"ఎలక్ట్రిషియన్", "Carpenter":"వడ్రంగి", "Mason":"తాపీ మేస్త్రీ", "Interlock paving":"ఇంటర్‌లాక్ పేవింగ్",
  "Hollow-brick work":"హాలో బ్రిక్ పని", "Painter":"పెయింటర్", "Plastering worker":"ప్లాస్టరింగ్ పనివారు", "Tile worker":"టైల్ పనివారు",
  "House-cleaning service":"ఇంటి శుభ్రపరిచే సేవ", "Air-conditioner installation and repair":"ఏసీ ఇన్‌స్టాలేషన్ మరియు మరమ్మతు", "Appliance repair":"గృహోపకరణాల మరమ్మతు",
  "Mechanic":"మెకానిక్", "Car mechanic":"కార్ మెకానిక్", "Photographer":"ఫోటోగ్రాఫర్", "CCTV installation":"సీసీటీవీ ఇన్‌స్టాలేషన్",
  "Home nurse":"హోమ్ నర్స్", "Tutor":"ట్యూటర్", "Web developer":"వెబ్ డెవలపర్", "Other local services":"ఇతర స్థానిక సేవలు", "All services":"అన్ని సేవలు"
};

const serviceNamesByLanguage: Partial<Record<Language, Record<string, string>>> = {
  ML: malayalamServiceNames,
  HI: hindiServiceNames,
  TA: tamilServiceNames,
  KN: kannadaServiceNames,
  TE: teluguServiceNames,
};

export function serviceLabel(service: string, language: Language) {
  return serviceNamesByLanguage[language]?.[service] ?? service;
}

export function serviceSearchLabels(service: string) {
  return Object.values(serviceNamesByLanguage)
    .map((labels) => labels?.[service])
    .filter((label): label is string => Boolean(label));
}
