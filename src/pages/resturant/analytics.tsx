import { motion } from "framer-motion";

export function AnalyticsReports() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      {/* Header & Breadcrumbs */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-[#813405] tracking-tight">
          Analytics & Reports
        </h1>
        <p className="text-xs font-bold text-[#D45113]/70 mt-1 uppercase tracking-wider">
          Analytics & Reports Module
        </p>
      </div>

      {/* Placeholder Workspace Card */}
      <div className="bg-[#FFFCF5] rounded-3xl p-8 border border-dashed border-[#F8DDA4]/60 shadow-card min-h-[350px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-bold text-[#813405]/60">Analytics & Reports Content goes here.</p>
          <p className="text-xs text-[#813405]/40 mt-1">Ready for future implementation</p>
        </div>
      </div>
    </motion.div>
  );
}
export default AnalyticsReports;
