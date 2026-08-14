"use client";

import { useEffect, useRef, useState } from "react";
import { languageOptions, type Language } from "./i18n";
import { translateInterfaceText } from "./interface-i18n";

const attributes = ["placeholder", "aria-label", "title", "alt"] as const;
const languageCodes = new Set<Language>(languageOptions.map((option) => option.code));

type TextRecord = { source: string; rendered: string };
type AttributeRecord = Map<string, { source: string; rendered: string }>;

function selectedLanguage(): Language {
  const stored = window.localStorage.getItem("nearlio-language") as Language | null;
  return stored && languageCodes.has(stored) ? stored : "EN";
}

function replaceTrimmed(raw: string, translated: string) {
  const start = raw.match(/^\s*/)?.[0] ?? "";
  const end = raw.match(/\s*$/)?.[0] ?? "";
  return `${start}${translated}${end}`;
}

export default function GlobalLanguage() {
  const [language, setLanguage] = useState<Language>("EN");
  const [showStandaloneSelector, setShowStandaloneSelector] = useState(false);
  const textRecords = useRef(new WeakMap<Text, TextRecord>());
  const attributeRecords = useRef(new WeakMap<Element, AttributeRecord>());

  useEffect(() => {
    const initial = selectedLanguage();
    setLanguage(initial);
    setShowStandaloneSelector(window.location.pathname !== "/");
    document.documentElement.lang = languageOptions.find((option) => option.code === initial)?.lang ?? "en";
    document.documentElement.dataset.language = initial;

    const syncLanguage = () => {
      const selected = document.documentElement.dataset.language as Language | undefined;
      if (selected && languageCodes.has(selected)) setLanguage(selected);
    };
    const observer = new MutationObserver(syncLanguage);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-language"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const translateTextNode = (node: Text) => {
      const raw = node.nodeValue ?? "";
      const current = raw.trim();
      if (!current) return;

      let record = textRecords.current.get(node);
      if (!record || (current !== record.rendered && current !== record.source)) {
        record = { source: current, rendered: current };
        textRecords.current.set(node, record);
      }

      const translated = translateInterfaceText(record.source, language);
      const next = replaceTrimmed(raw, translated);
      record.rendered = translated;
      if (node.nodeValue !== next) node.nodeValue = next;
    };

    const translateAttributes = (element: Element) => {
      let records = attributeRecords.current.get(element);
      if (!records) {
        records = new Map();
        attributeRecords.current.set(element, records);
      }

      for (const attribute of attributes) {
        const current = element.getAttribute(attribute);
        if (!current?.trim()) continue;
        let record = records.get(attribute);
        if (!record || (current !== record.rendered && current !== record.source)) {
          record = { source: current, rendered: current };
          records.set(attribute, record);
        }
        const translated = translateInterfaceText(record.source, language);
        record.rendered = translated;
        if (current !== translated) element.setAttribute(attribute, translated);
      }
    };

    const translateTree = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        translateTextNode(root as Text);
        return;
      }
      if (!(root instanceof Element) && root !== document.body) return;
      if (root instanceof Element && ["SCRIPT", "STYLE", "NOSCRIPT"].includes(root.tagName)) return;

      if (root instanceof Element) translateAttributes(root);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
          return parent && ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT;
        },
      });
      let node = walker.nextNode();
      while (node) {
        if (node.nodeType === Node.TEXT_NODE) translateTextNode(node as Text);
        else translateAttributes(node as Element);
        node = walker.nextNode();
      }
    };

    translateTree(document.body);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") translateTextNode(mutation.target as Text);
        else if (mutation.type === "attributes") translateAttributes(mutation.target as Element);
        else mutation.addedNodes.forEach(translateTree);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...attributes],
    });
    return () => observer.disconnect();
  }, [language]);

  function changeLanguage(next: Language) {
    window.localStorage.setItem("nearlio-language", next);
    document.documentElement.lang = languageOptions.find((option) => option.code === next)?.lang ?? "en";
    document.documentElement.dataset.language = next;
    setLanguage(next);
  }

  if (!showStandaloneSelector) return null;
  return (
    <label className="global-language-switch" aria-label="Choose language">
      <span aria-hidden="true">文</span>
      <select value={language} onChange={(event) => changeLanguage(event.target.value as Language)} aria-label="Choose language">
        {languageOptions.map((option) => (
          <option key={option.code} value={option.code} lang={option.lang}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
