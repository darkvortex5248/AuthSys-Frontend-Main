'use client';
import { motion } from 'framer-motion';

const shimmer = `relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent`;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.08 } },
};

export default function LoadingSkeleton() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className={`h-8 w-48 rounded-xl bg-white/5 ${shimmer}`} />
        <div className={`h-10 w-32 rounded-xl bg-white/5 ${shimmer}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`h-28 rounded-2xl bg-white/5 ${shimmer}`} />
        ))}
      </div>

      <div className={`h-96 rounded-2xl bg-white/5 ${shimmer}`} />
    </motion.div>
  );
}
