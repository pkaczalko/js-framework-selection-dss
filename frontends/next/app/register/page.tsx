import { GuestOnly } from '@/components/GuestOnly';
import { RegisterForm } from '@/components/RegisterForm';

export default function RegisterPage() {
  return (
    <GuestOnly>
      <RegisterForm />
    </GuestOnly>
  );
}
