import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

import { getFirebaseAuth } from './firebase';

export async function signUp(name: string, email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    await updateProfile(cred.user, { displayName: name });
  }
  await sendEmailVerification(cred.user);
  return cred.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logout(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

export async function resendVerification(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth.currentUser) throw new Error('Não há usuário logado.');
  await sendEmailVerification(auth.currentUser);
}

export async function reloadUser(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth.currentUser) return null;
  await reload(auth.currentUser);
  // Força refresh do ID token pra que o claim `email_verified` atualizado pelo
  // Firebase chegue no backend. Sem isso, o backend continua vendo o token
  // antigo (cached, vale ~1h) e retorna 403 mesmo após o usuário verificar.
  await auth.currentUser.getIdToken(true);
  return auth.currentUser;
}

export async function getCurrentIdToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken();
}

export function subscribeAuth(cb: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, cb);
}
