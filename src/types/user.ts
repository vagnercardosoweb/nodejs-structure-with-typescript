export type User = {
  id: string;
  name: string;
  email: string;
  birth_date: Date;
  code_to_invite: string;
  password_hash: string;
  confirmed_email_at: Date | null;
  login_blocked_until: Date | null;
  created_at: Date;
  deleted_at: Date | null;
  updated_at: Date;
};
