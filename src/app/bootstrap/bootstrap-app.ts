import {
  ApplicationRef,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { BootstrapCmp } from './bootstrap';
import { routes } from '@app/bootstrap/routes';
import { provideServiceWorker } from '@angular/service-worker';

export async function bootstrapApp(): Promise<ApplicationRef> {
  return bootstrapApplication(BootstrapCmp, {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideZonelessChangeDetection(),
      provideRouter(routes),
      provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000',
      }),
    ]
  });
}
