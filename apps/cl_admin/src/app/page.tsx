import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const isValid = Boolean(
    token &&
    token.trim() !== '' &&
    token !== 'undefined' &&
    token !== 'null'
  );
  if (!isValid) {
    redirect('/login');
  }
  redirect('/dashboard');
}
