import { motion } from 'framer-motion';

export default function Logo({ size = 32, className = '' }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`flex items-center gap-2 ${className}`}
    >
      <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#lg)" />
        <circle cx="11" cy="14" r="4" fill="none" stroke="#fff" strokeWidth="2.4" />
        <path d="M17 20c0-3 3-4.5 6-4.5s6 1.5 6 4.5v4H17v-4z" fill="none" stroke="#fff" strokeWidth="2.4" />
      </svg>
      <span className="font-bold text-lg tracking-tight">
        VectorShare <span className="bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">AI</span>
      </span>
    </motion.div>
  );
}
