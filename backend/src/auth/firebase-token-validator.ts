export interface FirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
}

export interface FirebaseTokenValidator {
  verify(token: string): Promise<FirebaseUser>;
}
