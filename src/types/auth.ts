export interface User {
    id: number;
    name: string;
    email: string;
    role_id: number;
}

export interface AuthResponse {
    message: string;
    user: User;
    token: string;
}
