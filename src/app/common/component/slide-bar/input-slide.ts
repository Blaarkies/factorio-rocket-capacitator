import {
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  output
} from '@angular/core';
import {
  finalize,
  fromEvent,
  map,
  sampleTime,
  startWith,
  takeUntil
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { coerceIn, mouseButtonPressed } from '@app/common/function/number';
import { WA_WINDOW } from '@ng-web-apis/common';
import {
  DisplaySlide
} from '@app/common/component/slide-bar/display-slide/display-slide';

@Directive({selector: 'app-display-slide[value]'})
export class InputSlide {

  private destroyRef = inject(DestroyRef);
  private window = inject(WA_WINDOW);

  value = output<number>();

  constructor() {
    const hostComponent = inject(DisplaySlide);
    if (!(hostComponent instanceof DisplaySlide)) {
      throw new Error('Cannot use [InputSlide] outside of [DisplaySlide]');
    }

    const host: ElementRef<HTMLDivElement> = inject(ElementRef);

    const effectRef = effect(() => {
      const bar = host.nativeElement
        .querySelector<HTMLDivElement>('div[data-clickable]');

      bar.style.setProperty('touch-action', 'none');
      this.destroyRef.onDestroy(() =>
        bar.style.setProperty('touch-action', null));

      fromEvent(bar, 'pointerdown')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((e: PointerEvent) => this.pointerDown(e, bar));

      effectRef.destroy();
    });
  }

  private pointerDown(event: PointerEvent, element: HTMLDivElement) {
    if (!mouseButtonPressed(event.buttons, 'left')) {
      return;
    }

    const {width, height} = element.getBoundingClientRect();
    const mainIsWidth = width > height;
    const initial = mainIsWidth ? event.offsetX : event.offsetY;
    const length = mainIsWidth ? width : height;

    element.style.setProperty('--width-duration-override', '0s');

    fromEvent(element, 'pointermove').pipe(
      sampleTime(16),
      map((e: PointerEvent) => mainIsWidth ? e.offsetX : e.offsetY),
      startWith(initial),
      map(offset => coerceIn(offset / length, 0, 1)),
      finalize(() =>
        element.style.setProperty('--width-duration-override', null)),
      takeUntilDestroyed(this.destroyRef),
      takeUntil(fromEvent(this.window, 'pointerup')),
    ).subscribe(v => this.value.emit(v));
  }

}
