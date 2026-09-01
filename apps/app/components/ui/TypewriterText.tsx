import React, { useState, useEffect } from 'react';
import { Text, TextStyle, View } from 'react-native';

interface TypewriterTextProps {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseTime?: number;
  style?: TextStyle | TextStyle[];
  cursorColor?: string;
}

export function TypewriterText({
  phrases,
  typingSpeed = 65,
  deletingSpeed = 35,
  pauseTime = 1800,
  style,
  cursorColor = '#C87D20',
}: TypewriterTextProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // Blinking cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  // Typewriter text loop
  useEffect(() => {
    if (!phrases || phrases.length === 0) return;

    const currentPhrase = phrases[phraseIndex % phrases.length];

    if (!isDeleting && charIndex === currentPhrase.length) {
      // Finished typing full phrase, pause before deleting
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseTime);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && charIndex === 0) {
      // Finished deleting, move to next phrase
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
      return;
    }

    const speed = isDeleting ? deletingSpeed : typingSpeed;
    const timeout = setTimeout(() => {
      setCharIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, speed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseTime]);

  const currentPhrase = phrases[phraseIndex % phrases.length] || '';
  const displayText = currentPhrase.substring(0, charIndex);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      <Text style={style} numberOfLines={1}>
        {displayText}
        <Text style={{ color: showCursor ? cursorColor : 'transparent', fontWeight: 'bold' }}>
          |
        </Text>
      </Text>
    </View>
  );
}

export default TypewriterText;
