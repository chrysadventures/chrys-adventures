import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import chrysHappy from "@assets/chrys_happy_new_nobg.png";
import chrysExcited from "@assets/chrys_excited_new_nobg.png";
import chrysThinking from "@assets/chrys_thinking_new_nobg.png";
import chrysRunning from "@assets/chrys_running_new_user_hd_nobg.png";
import chrysCelebrate from "@assets/chrys_swinging_new_nobg.png";

export type ChrysМood =
  | 'happy'
  | 'excited'
  | 'thinking'
  | 'oops'
  | 'celebrating'
  | 'pointing'
  | 'shy'
  | 'running'
  | 'swinging';

export const ALL_CHRYS_MOODS: ChrysМood[] = [
  'happy', 'excited', 'thinking', 'oops', 'celebrating',
  'pointing', 'shy', 'running', 'swinging',
];

interface ChrysCharacterProps {
  mood?: ChrysМood;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  bounce?: boolean;
}

const IMAGES: Record<ChrysМood, string> = {
  happy:      chrysHappy,
  excited:    chrysExcited,
  thinking:   chrysThinking,
  oops:       chrysExcited,
  celebrating: chrysCelebrate,
  pointing:   chrysExcited,
  shy:        chrysThinking,
  running:    chrysRunning,
  swinging:   chrysCelebrate,
};

const SIZES = {
  sm: 'w-20 h-20',
  md: 'w-36 h-36',
  lg: 'w-52 h-52',
  xl: 'w-72 h-72',
};

const IMG_STYLE: React.CSSProperties = {
  filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.22)) saturate(1.2) contrast(1.05)',
};

export function ChrysCharacter({ mood = 'happy', className = '', size = 'md', bounce = true }: ChrysCharacterProps) {
  return (
    <div className={`relative ${SIZES[size]} ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={mood}
          className="w-full h-full"
          initial={{ scale: 0.75, opacity: 0, y: 24 }}
          animate={
            bounce
              ? {
                  scale: 1,
                  opacity: 1,
                  y: [0, -10, 0, -5, 0],
                  transition: {
                    scale: { type: 'spring', stiffness: 300, damping: 20, duration: 0.45 },
                    opacity: { duration: 0.25 },
                    y: { delay: 0.3, duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
                  },
                }
              : { scale: 1, opacity: 1, y: 0 }
          }
          exit={{ scale: 0.75, opacity: 0, y: -18, transition: { duration: 0.18 } }}
        >
          <img
            src={IMAGES[mood]}
            alt={`Chrys ${mood}`}
            className="w-full h-full object-contain"
            style={IMG_STYLE}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
