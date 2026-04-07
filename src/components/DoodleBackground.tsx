import React from 'react';
import { motion } from 'motion/react';

export const DoodleBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-20">
      {/* Top Left Doodle */}
      <motion.svg
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="absolute -top-10 -left-10 w-64 h-64 text-[#FFB74D]"
        viewBox="0 0 200 200"
      >
        <path
          className="doodle-path"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          d="M30,100 Q50,50 100,30 T170,100 Q150,150 100,170 T30,100"
        />
        <circle cx="100" cy="100" r="10" fill="currentColor" />
      </motion.svg>

      {/* Bottom Right Doodle */}
      <motion.svg
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute -bottom-10 -right-10 w-80 h-80 text-[#81C784]"
        viewBox="0 0 200 200"
      >
        <path
          className="doodle-path"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          d="M50,50 C80,20 120,20 150,50 S180,120 150,150 S80,180 50,150 S20,80 50,50"
        />
        <path
          className="doodle-path"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          d="M70,70 L130,130 M130,70 L70,130"
        />
      </motion.svg>

      {/* Scattered Stars/Dots */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: i * 0.1 }}
          className="absolute w-2 h-2 bg-[#FFD54F] rounded-full"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
};
