import StaffCard from "./StaffCard";
import { StaffWithUserData } from "../../appointments/components/types";

interface Props {
  staff: StaffWithUserData[];
  onDetails: (member: StaffWithUserData) => void;
  onEdit: (member: StaffWithUserData) => void;
  onDelete: (id: number) => void;
}

const StaffList = ({ staff, onDetails, onEdit, onDelete }: Props) => (
  <div className="divide-y divide-[#e8dcd4] border border-[#e8dcd4] rounded-xl bg-white/50 backdrop-blur-md shadow-sm">
    <ul>
      {staff.length > 0 ? (
        staff.map(member => (
          <StaffCard
            key={member.staff_id}
            member={member}
            onDetails={onDetails}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      ) : (
        <div className="p-6 text-center text-[#5f4b5a] font-medium">
          No staff members found.
        </div>
      )}
    </ul>
  </div>
);

export default StaffList;
