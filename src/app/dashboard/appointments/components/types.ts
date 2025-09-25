

export interface Service {
  service_id: number;
  serviceName: string;
  serviceDescription: string;
  duration_minutes: number;
  price: number;
  category: string;
}

export interface Client {
  client_id: number;
  clientFirstName: string;
  clientLastName: string;
  phoneNumber?: string;
  email?: string;
}

export interface Appointment {
  appointment_id: number;
  client_id: number;
  service_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  notes: string;
  status: "pending" | "confirmed" | "declined";
  staff_id: number | null;

  clientFirstName: string;
  clientLastName: string;
  clientPhoneNumber?: string;
  clientEmail?: string;
  serviceName: string;
  serviceDescription: string;
  servicePrice: number;
  serviceCategory: string;
}

export interface Timeslot {
  timeslot_id: number;
  day_of_week: string;
  time_slot: string;
}



export interface Staff {
  staff_id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string,
  phoneNumber: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  roleId: string;
  roleName: string;
}

export interface Role {
  role_id: number;
  role_name: string;
}


export interface StaffWithUserData {
  staff_id?: number; // staff table PK
  user_id: number;   // from users table
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password?: string; // probably hidden unless creating
  phone_number: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  role_id: number;
  role_name?: string; // optional join field
}