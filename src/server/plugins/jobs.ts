import { definePlugin } from 'nitro';
import { closeSmsWorker, ensureSmsWorker } from '../jobs/sms-broadcast';

// Starts the BullMQ SMS worker when each server process boots, so broadcasts
// queued before a restart/deploy resume immediately instead of waiting for
// the next enqueue. Registered in vite.config.ts (nitro({ plugins })).
export default definePlugin((nitroApp) => {
  ensureSmsWorker();

  // Stop taking new jobs and let in-flight sends finish on shutdown.
  // srvx's graceful-shutdown handler (SIGINT/SIGTERM) only closes the HTTP
  // listener -- it neither exits nor fires Nitro's 'close' hook -- so listen
  // for the signals directly. (srvx already overrides Node's default
  // exit-on-signal, so these listeners don't change how the process exits;
  // PM2 still force-kills after its kill_timeout.)
  const stop = () => void closeSmsWorker();
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
  nitroApp.hooks?.hook('close', stop);
});
