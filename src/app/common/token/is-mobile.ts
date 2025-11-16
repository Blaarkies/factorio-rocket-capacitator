import { inject, InjectionToken } from '@angular/core';
import { WA_WINDOW } from '@ng-web-apis/common';
import { fromEvent, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

export const IS_MOBILE = new InjectionToken(
  'Returns a boolean signal representing whether the current device is a ' +
  'mobile device (cellphone) or not',
  {
    providedIn: 'root',
    factory: () => {
      const mediaQueryWidth = inject(WA_WINDOW).matchMedia(
        // Cannot hover.
        // Touchscreen input.
        // Smaller than 900px in some axis.
        `
        (hover: none)
          and (pointer: coarse)
          and ( (max-width: 900px) or (max-height: 900px) )
        `.replace(/\s+/g, ' ').trim()
      );

      const match$ = fromEvent(mediaQueryWidth, 'change').pipe(
        map((e: MediaQueryListEvent) => e.matches),
        startWith(mediaQueryWidth.matches),
      );

      return toSignal(match$);
    },
  });
