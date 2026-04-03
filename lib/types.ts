export type UserRole = "student" | "faculty" | "dean";
export type ProjectStatus = "pending" | "approved" | "rejected";
export type PaymentRowStatus = "pending" | "paid";

export type ProfileRow = {
  id: string;
  name: string;
  role: UserRole;
  created_at: string;
};

export type ProjectRow = {
  id: string;
  title: string;
  description: string | null;
  domain: string | null;
  status: ProjectStatus;
  faculty_id: string | null;
  created_at: string;
  lead_full_name?: string | null;
  lead_roll_number?: string | null;
  lead_course?: string | null;
  lead_semester?: string | null;
  progress_summary?: string | null;
  mvp_timeline?: string | null;
  funds_requested?: number | null;
  ppt_storage_path?: string | null;
  budget_doc_storage_path?: string | null;
  project_image_paths?: string[] | null;
};

export type ProgressRow = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  created_at: string;
};

export type ExpenseRow = {
  id: string;
  project_id: string;
  amount: number;
  description: string | null;
  bill_url: string | null;
  created_at: string;
};

export type PaymentDetailsRow = {
  id: string;
  project_id: string;
  account_number: string;
  ifsc: string;
  holder_name: string;
  qr_code_url: string | null;
  paytm_qr_url?: string | null;
};

export type PaymentRecordRow = {
  id: string;
  project_id: string;
  approved_amount: number;
  status: PaymentRowStatus;
  receipt_url: string | null;
  created_at: string;
};
