import { useCallback, useMemo } from 'react';
import type { OptionType } from '@/components/ui';

import type { Language } from '@/lib/i18n/resources';
import { Options, useModal } from '@/components/ui';
import { translate, useSelectedLanguage } from '@/lib/i18n';

import { SettingsItem } from './settings-item';

export function LanguageItem() {
  const { language, setLanguage } = useSelectedLanguage();
  const modal = useModal();
  const onSelect = useCallback(
    (option: OptionType) => {
      setLanguage(option.value as Language);
      modal.dismiss();
    },
    [setLanguage, modal],
  );

  const langs = useMemo(
    () => [
      { label: translate('settings.english'), value: 'en' },
      { label: translate('settings.arabic'), value: 'ar' },
    ],
    [],
  );

  const selectedLanguage = useMemo(
    () => langs.find(lang => lang.value === language),
    [language, langs],
  );

  return (
    <>
      <SettingsItem
        text="settings.language"
        value={selectedLanguage?.label}
        onPress={modal.present}
      />
      <Options
        ref={modal.ref}
        options={langs}
        onSelect={onSelect}
        value={selectedLanguage?.value}
      />
    </>
  );
}
