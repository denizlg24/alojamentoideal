"use client";

import { motion } from "framer-motion";
import { MapPinHouse } from "lucide-react";

export const AccommodationMapTitle = ({ label }: { label: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-7xl mx-auto text-left"
    >
      <h1 className="md:text-2xl sm:text-xl text-lg font-semibold flex items-center gap-2">
        <MapPinHouse className="w-5 h-5 text-primary" />
        {label}
      </h1>
    </motion.div>
  );
};
