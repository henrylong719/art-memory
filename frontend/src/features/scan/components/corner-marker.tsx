import { View } from '@/components/ui';

const positionClasses = {
  tl: '-top-px -left-px border-t-4 border-l-4 rounded-tl-sm',
  tr: '-top-px -right-px border-t-4 border-r-4 rounded-tr-sm',
  bl: '-bottom-px -left-px border-b-4 border-l-4 rounded-bl-sm',
  br: '-bottom-px -right-px border-b-4 border-r-4 rounded-br-sm',
} as const;

export function CornerMarker({
  position,
}: {
  position: 'tl' | 'tr' | 'bl' | 'br';
}) {
  return (
    <View
      className={`absolute w-6 h-6 border-white ${positionClasses[position]}`}
    />
  );
}
