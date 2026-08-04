export const translations = {
  EN: { find: "Find trusted help near you", search: "What service do you need?", location: "Kochi, Kerala", nearby: "Top professionals near you" },
  HI: { find: "अपने पास भरोसेमंद सेवा पाएँ", search: "आपको कौन सी सेवा चाहिए?", location: "कोच्चि, केरल", nearby: "आपके पास के श्रेष्ठ पेशेवर" },
  ML: { find: "അടുത്തുള്ള വിശ്വസ്ത സേവനം കണ്ടെത്തൂ", search: "ഏത് സേവനമാണ് വേണ്ടത്?", location: "കൊച്ചി, കേരളം", nearby: "നിങ്ങളുടെ അടുത്തുള്ള മികച്ച വിദഗ്ധർ" },
} as const;

export type Language = keyof typeof translations;
