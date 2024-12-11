export interface User {
    id: number;
    username: string;
    email: string;
    role: string[];
    identifier: string;
  }
  
  export interface LoginCredentials {
    username: string;
    password: string;
  }

  