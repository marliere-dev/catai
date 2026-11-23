export interface FirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}

export interface FirebaseTokenValidator {
  verify(token: string): Promise<FirebaseUser>;
}
