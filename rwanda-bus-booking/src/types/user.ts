export enum UserRole {
    PUBLIC = 'PUBLIC',
    USER = 'USER',
    OPERATOR = 'OPERATOR',
    ADMIN = 'ADMIN'
  }
  
  export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    createdAt: Date;
  }
  