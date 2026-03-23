/* eslint-disable better-tailwindcss/no-unknown-classes */
import type { ComponentType, ReactNode } from 'react';
import { useCallback, useState, type Ref } from 'react';
import type { TextInputProps } from 'react-native';
import {
  I18nManager,
  TextInput as NTextInput,
  StyleSheet,
  View,
} from 'react-native';
import { tv } from 'tailwind-variants';

import { Text } from './text';

const inputShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 4,
  elevation: 1,
} as const;

const inputTv = tv({
  slots: {
    container: '',
    label:
      'text-[13px] font-semibold tracking-widest uppercase text-stone-500 mb-2 ml-1',
    inputWrapper:
      'bg-white rounded-2xl border border-stone-200 flex-row items-center px-4',
    input: 'flex-1 py-3.5 text-[15px] text-stone-900',
    errorText: 'text-[12px] text-red-500 mt-1.5 ml-1',
  },

  variants: {
    focused: {
      true: {
        inputWrapper: 'border-stone-400',
      },
    },
    error: {
      true: {
        inputWrapper: 'border-red-300 bg-red-50/30',
        label: 'text-red-600',
      },
    },
    disabled: {
      true: {
        inputWrapper: 'bg-stone-100 border-stone-200/60',
        input: 'text-stone-500',
      },
    },
    variant: {
      default: {},
      search: {
        inputWrapper:
          'bg-stone-200/50 border-stone-200 rounded-full',
        input: 'pl-3',
      },
    },
    multiline: {
      true: {
        input: 'leading-6',
      },
    },
  },
  defaultVariants: {
    focused: false,
    error: false,
    disabled: false,
    variant: 'default',
    multiline: false,
  },
});

export type NInputProps = {
  label?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  variant?: 'default' | 'search';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
  hint?: string;
  inputComponent?: ComponentType<TextInputProps>;
} & TextInputProps;

export function Input({
  ref,
  ...props
}: NInputProps & { ref?: Ref<NTextInput | null> }) {
  const {
    label,
    error,
    required,
    variant = 'default',
    leftIcon,
    rightIcon,
    containerClassName,
    hint,
    inputComponent: InputComponent = NTextInput,
    testID,
    onBlur: onBlurProp,
    onFocus: onFocusProp,
    multiline,
    ...inputProps
  } = props;
  const [isFocused, setIsFocused] = useState(false);

  const onBlur = useCallback(
    (e: any) => {
      setIsFocused(false);
      onBlurProp?.(e);
    },
    [onBlurProp],
  );

  const onFocus = useCallback(
    (e: any) => {
      setIsFocused(true);
      onFocusProp?.(e);
    },
    [onFocusProp],
  );

  const styles = inputTv({
    error: Boolean(error),
    focused: isFocused,
    disabled: Boolean(props.disabled),
    variant,
    multiline: Boolean(multiline),
  });
  const writingDirection: 'ltr' | 'rtl' = I18nManager.isRTL ? 'rtl' : 'ltr';
  const textAlign: 'left' | 'right' = I18nManager.isRTL ? 'right' : 'left';
  const textAlignVertical: 'top' | undefined = multiline ? 'top' : undefined;

  const sharedInputProps = {
    testID,
    placeholderTextColor: '#a8a29e',
    className: styles.input(),
    onBlur,
    onFocus,
    multiline,
    textAlignVertical,
    ...inputProps,
    style: StyleSheet.flatten([
      { writingDirection },
      { textAlign },
      multiline && inputProps.style == null
        ? { minHeight: 120 }
        : undefined,
      inputProps.style,
    ]),
  };

  return (
    <View className={containerClassName ?? styles.container()}>
      {label ? (
        <Text
          testID={testID ? `${testID}-label` : undefined}
          className={styles.label()}
        >
          {label}
          {required && <Text className="text-red-500"> *</Text>}
        </Text>
      ) : null}
      <View
        className={styles.inputWrapper()}
        style={!props.disabled ? inputShadow : undefined}
      >
        {leftIcon}
        {InputComponent === NTextInput ? (
          <NTextInput ref={ref} {...sharedInputProps} />
        ) : (
          <InputComponent {...sharedInputProps} />
        )}
        {rightIcon}
      </View>
      {hint && !error ? (
        <Text className="text-[11px] text-stone-400 mt-1.5 ml-1">{hint}</Text>
      ) : null}
      {error ? (
        <Text
          testID={testID ? `${testID}-error` : undefined}
          className={styles.errorText()}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
