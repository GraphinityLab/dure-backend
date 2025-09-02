import { FaUser, FaEnvelope, FaPhone, FaInfoCircle, FaEdit, FaTrash } from "react-icons/fa";
import { StaffWithUserData } from "../../appointments/components/types";

interface Props {
  member: StaffWithUserData;
  onDetails: (member: StaffWithUserData) => void;
  onEdit: (member: StaffWithUserData) => void;
  onDelete: (id: number) => void;
}

const StaffCard = ({ member, onDetails, onEdit, onDelete }: Props) => (
  <li className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 hover:bg-white/70 transition text-sm text-[#5f4b5a]">
    <div className="flex flex-wrap gap-x-6 gap-y-1 items-center">
      <span className="flex items-center"><FaUser className="mr-2" /> {member.first_name} {member.last_name}</span>
      {member.phone_number && <span className="flex items-center"><FaPhone className="mr-2" /> {member.phone_number}</span>}
      <span className="flex items-center"><FaEnvelope className="mr-2" /> {member.email}</span>
    </div>
    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
      <span className="text-xs font-medium px-2 py-0.5 rounded-full uppercase bg-blue-200 text-blue-800">
        {member.position}
      </span>
      <button onClick={() => onDetails(member)} className="p-2 rounded-full text-xs bg-[#3e2e3d] text-white hover:bg-[#5f4b5a] transition"><FaInfoCircle /></button>
      <button onClick={() => onEdit(member)} className="p-2 rounded-full text-xs bg-[#c1a38f] text-white hover:bg-[#a78974] transition"><FaEdit /></button>
      <button onClick={() => onDelete(member.staff_id)} className="p-2 rounded-full text-xs bg-red-100 text-red-700 hover:bg-red-200 transition"><FaTrash /></button>
    </div>
  </li>
);

export default StaffCard;
