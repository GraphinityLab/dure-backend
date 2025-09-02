import { FaSearch, FaPlus } from "react-icons/fa";

interface Props {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateClick: () => void;
}

const StaffSearchBar = ({ searchQuery, onSearchChange, onCreateClick }: Props) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
    <div className="relative w-full sm:w-2/3">
      <input
        type="text"
        placeholder="Search by ID, name, email, phone or role..."
        value={searchQuery}
        onChange={onSearchChange}
        className="w-full p-3 pl-10 rounded-full border border-[#e8dcd4] bg-white/60 focus:outline-none focus:ring-2 focus:ring-[#c1a38f] transition"
      />
      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a78974]" />
    </div>
    <button
      onClick={onCreateClick}
      className="p-3 rounded-full bg-[#c1a38f] text-white hover:bg-[#a78974] transition-colors duration-300"
    >
      <FaPlus />
    </button>
  </div>
);

export default StaffSearchBar;
