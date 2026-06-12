export interface IauthService {
  registerUser(email: string | undefined, password: string | undefined): Promise<{ token: string; email: string }>;
  loginUser(email: string | undefined, password: string | undefined): Promise<{ token: string; email: string }>;
}
