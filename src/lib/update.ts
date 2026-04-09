import { check } from '@tauri-apps/plugin-updater';
import { ask, message } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';

export async function checkForUpdates() {
    try {
        const update = await check();

        if (update) {
            // An update is available!
            console.log(`Found update ${update.version} from ${update.date}`);

            // Ask the user if they want to install it
            const yes = await ask(`Update auf Version ${update.version} ist verfügbar! Möchten Sie es jetzt installieren?`, {
                title: 'Update verfügbar',
                kind: 'info'
            });

            if (yes) {
                // Download and install the update
                await update.downloadAndInstall();
                // Relaunch the app to apply changes
                await relaunch();
            }
        } else {
            // No update available
            // await message('Sie verwenden die aktuellste Version.', { title: 'Aktuell' }); // Don't show a message everytime
        }
    } catch (error) {
        console.error('Failed to check for updates:', error);
    }
}