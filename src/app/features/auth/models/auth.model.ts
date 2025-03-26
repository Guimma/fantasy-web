export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: 'admin' | 'user';
  user_created_at: string;
}

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'user';
  dataCriacao: Date;
  ultimoAcesso?: Date;
}

export interface ChangePasswordRequest {
  senhaAtual: string;
  novaSenha: string;
  confirmarNovaSenha: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  error: string | null;
} 