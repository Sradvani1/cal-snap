import type { ButtonHTMLAttributes } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean;
};

export function PrimaryButton({ className, fullWidth, ...props }: PrimaryButtonProps) {
  return (
    <Button
      className={cn(fullWidth && 'w-full', className)}
      {...props}
    />
  );
}

export function SecondaryButton({
  className,
  fullWidth,
  ...props
}: PrimaryButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn(fullWidth && 'w-full', className)}
      {...props}
    />
  );
}
