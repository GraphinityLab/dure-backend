import { motion } from "framer-motion";

const StaffHeader = () => (
  <header className="text-center mb-8">
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-3xl md:text-4xl font-extrabold tracking-tight"
    >
      Our Team
    </motion.h1>
    <p className="text-base text-[#3e2e3d] opacity-80 mt-1">
      Meet the amazing people who make it all happen.
    </p>
  </header>
);

export default StaffHeader;
