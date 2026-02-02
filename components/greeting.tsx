import { motion } from "framer-motion";
import Image from "next/image";

export const Greeting = () => {
  return (
    <div
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 md:px-8"
      key="overview"
    >
      <motion.div
        animate={{ 
          opacity: 1,
          y: [0, -12, 0]
        }}
        className="mb-6"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        transition={{ 
          opacity: { delay: 0.3, duration: 0.5 },
          y: { 
            delay: 0.8,
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      >
        <Image 
          src="/images/genie.svg" 
          alt="Genie" 
          width={120} 
          height={120}
          className="w-24 h-24 md:w-32 md:h-32"
        />
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="font-bold text-3xl md:text-4xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        style={{ fontFamily: "var(--font-stardom)" }}
        transition={{ delay: 0.5 }}
      >
        genie
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-lg text-zinc-400 md:text-xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        on a budget
      </motion.div>
    </div>
  );
};
