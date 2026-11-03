import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';

import { HAPTIC, haptic } from '../../lib/haptics';
import { share, type ShareContent } from '../../lib/share';
import { Button } from './Button';
import type { ButtonSize, ButtonVariant } from './styles';

export function ShareButton({
  content,
  label = 'Share',
  variant = 'ghost',
  size = 'md',
  className = '',
}: {
  content: ShareContent;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const [shared, setShared] = useState(false);
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={async () => {
        haptic(HAPTIC.tap);
        const result = await share(content);
        if (result !== 'cancelled') setShared(true);
      }}
    >
      {shared ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        <Share2 className="size-4" aria-hidden="true" />
      )}
      {label}
    </Button>
  );
}
