export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface OTPFormData {
  email: string;
  otp: string;
}

export interface NoteFormData {
  title: string;
  content: string;
  tags: string[];
}

export interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginFormData) => Promise<void>;
  signup: (data: SignupFormData) => Promise<{ email: string; tempData: any }>;
  verifyOTP: (data: OTPFormData & { tempData: any }) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export interface NotesContextType {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  fetchNotes: (params?: { page?: number; limit?: number; search?: string; tags?: string }) => Promise<void>;
  createNote: (data: NoteFormData) => Promise<Note>;
  updateNote: (id: string, data: NoteFormData) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  selectedNote: Note | null;
  setSelectedNote: (note: Note | null) => void;
}
