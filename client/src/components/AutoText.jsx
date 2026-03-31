import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { liveTranslate } from "../i18n";

const AutoText = ({ text }) => {
  const { i18n } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const translate = async () => {
      if (i18n.language === 'en') {
        setLoading(true);
        const result = await liveTranslate(text);
        setTranslatedText(result);
        setLoading(false);
      } else {
        setTranslatedText(text); // Quay lại Tiếng Việt
      }
    };

    translate();
  }, [text, i18n.language]);

  if (loading) return <span className="opacity-50 blur-[1px] transition-all">{translatedText || text}</span>;
  return <span className="whitespace-pre-wrap">{translatedText}</span>;
};

export const useAutoTranslate = (text) => {
  const { i18n } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    const translate = async () => {
      if (i18n.language === 'en') {
        const result = await liveTranslate(text);
        setTranslatedText(result);
      } else {
        setTranslatedText(text);
      }
    };
    translate();
  }, [text, i18n.language]);

  return translatedText;
};

export default AutoText;
