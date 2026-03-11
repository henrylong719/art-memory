import { Motion } from '@legendapp/motion';
import { Check, CircleAlert } from 'lucide-react-native';
import { Text, View } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastProps = {
  text: string;
  variant?: 'success' | 'error';
};

const Toast = ({ text, variant = 'success' }: ToastProps) => {
  const insets = useSafeAreaInsets();

  const isError = variant === 'error';

  const containerClassName = isError
    ? 'bg-red-950/95 border border-red-800/40'
    : 'bg-stone-900 border border-white/10';

  const iconWrapperClassName = isError
    ? 'w-5 h-5 rounded-full bg-red-500/20 items-center justify-center'
    : 'w-5 h-5 rounded-full bg-white/20 items-center justify-center';

  const textClassName = isError
    ? 'text-[14px] font-medium text-red-50 tracking-wide'
    : 'text-[14px] font-medium text-white tracking-wide';

  return (
    <Motion.View
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'timing', duration: 300 }}
      className="absolute z-20 self-center"
      style={{ top: insets.top + 60 }}
    >
      <View
        className={`flex-row items-center gap-2.5 rounded-full px-5 py-3 ${containerClassName}`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <View className={iconWrapperClassName}>
          {isError ? (
            <CircleAlert size={12} color="#fff" strokeWidth={2.5} />
          ) : (
            <Check size={12} color="#fff" strokeWidth={3} />
          )}
        </View>

        <Text className={textClassName}>{text}</Text>
      </View>
    </Motion.View>
  );
};

export default Toast;
