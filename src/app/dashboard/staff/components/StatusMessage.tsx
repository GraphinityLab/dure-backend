import { motion } from "framer-motion";

interface StatusMessageProps {
  type: string; // "success" | "error"
  message: string;
}

const StatusMessage = ({ type, message }: StatusMessageProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-4 mb-4 rounded-lg text-sm text-center font-bold ${
        type === "success"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {message}
    </motion.div>
  );
};

export default StatusMessage;
