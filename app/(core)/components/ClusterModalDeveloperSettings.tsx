import { localStorageIsAvailable } from '@/app/(shared)/utils/local-storage';
import { ChangeEvent } from 'react';

export default function ClusterModalDeveloperSettings() {
  const showDeveloperSettings = localStorageIsAvailable();
  const enableCustomUrl = showDeveloperSettings && localStorage.getItem('enableCustomUrl') !== null;
  const onToggleCustomUrlFeature = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      localStorage.setItem('enableCustomUrl', '');
    } else {
      localStorage.removeItem('enableCustomUrl');
    }
  };
  if (showDeveloperSettings !== true) {
    return null;
  }
  return (
    <>
      <hr />
      <h2 className="mt-4 mb-4 text-center">Developer Settings</h2>
      <div className="flex justify-between">
        <span className="mr-3">Enable custom url param</span>
        <div className="relative inline-flex items-center">
          <input
            type="checkbox"
            defaultChecked={enableCustomUrl}
            className="checked:bg-primary h-4 w-4 rounded border-gray-300 transition"
            id="cardToggle"
            onChange={onToggleCustomUrlFeature}
          />
          <label className="ml-2 text-sm" htmlFor="cardToggle"></label>
        </div>
      </div>
      <p className="text-muted-foreground mt-3 text-sm">
        Enable this setting to easily connect to a custom cluster via the &ldquo;customUrl&rdquo; url param.
      </p>
    </>
  );
}
