"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Greeting = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <div
        className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 md:px-8 pointer-events-none"
        key="overview"
      >
        <motion.div
          animate={{ 
            opacity: 1,
            y: [0, -12, 0]
          }}
          className="mb-6 relative cursor-pointer select-none pointer-events-auto"
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
          onClick={(e) => {
            e.preventDefault();
            setIsDialogOpen(true);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsDialogOpen(true);
            }
          }}
        >
          {/* Speech Bubble */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, duration: 0.3 }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
          >
            <div className="relative bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-4 py-2 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 text-sm">
              Click me to find out more!
              {/* Triangle pointer */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white dark:border-t-zinc-800" />
            </div>
          </motion.div>
          
          <Image 
            src="/images/genie.svg" 
            alt="Genie" 
            width={120} 
            height={120}
            className="w-24 h-24 md:w-32 md:h-32 hover:scale-110 transition-transform"
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

    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl">
        <DialogHeader>
          <DialogTitle>About Genie on a Budget</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4 text-left pt-4">
              <div>
                This is a lightweight version of Databricks Genie, which allows users to send SQL statements in natural language.
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-2">Databricks Stack</h4>
                <div className="text-sm space-y-1">
                  <p>
                    The backend leverages <span className="font-medium text-foreground">Delta Tables</span> for Parquet data ingestion, 
                    <span className="font-medium text-foreground"> ETL jobs</span> for materialized views, 
                    and a <span className="font-medium text-foreground">serverless SQL warehouse</span> for query execution.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Meta Llama 3.3 70B Instruct</span> is served via 
                    <span className="font-medium text-foreground"> Databricks Model Serving</span>, alongside other provider options (OpenAI, Google, etc.).
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Application Stack</h4>
                <div className="text-sm">
                  Built with Next.js and the Vercel AI SDK, self-hosted on a Hetzner VPS.
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Dataset</h4>
                <div className="text-sm">
                  Based on a HuggingFace dataset containing 200k Amazon product reviews.{" "}
                  <a
                    href="https://huggingface.co/datasets/minhth2nh/amazon_product_review_283K"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View dataset
                  </a>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
    </>
  );
};
