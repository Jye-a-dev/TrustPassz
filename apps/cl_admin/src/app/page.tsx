import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isTokenExpired } from '@/lib/jwt-edge';

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  const isValid = Boolean(
    token &&
    token.trim() !== '' &&
    token !== 'undefined' &&
    token !== 'null' &&
    !isTokenExpired(token)
  );

  if (!isValid) {
    redirect('/login');
  }

  redirect('/dashboard');
}
