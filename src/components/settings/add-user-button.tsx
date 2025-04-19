'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '../ui/button';

export default function AddUserButton() {
  'use client';
  const { pending } = useFormStatus();
  return (
    <Button type='submit' disabled={pending}>
      {pending ? 'Adding...' : 'Add User'}
    </Button>
  );
}
