import { GuestOnly } from '@/components/GuestOnly';
import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <GuestOnly>
      <LoginForm />
    </GuestOnly>
  );
}
