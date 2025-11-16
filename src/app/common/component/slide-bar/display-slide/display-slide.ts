import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-display-slide',
  imports: [],
  templateUrl: './display-slide.html',
  styleUrl: './display-slide.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisplaySlide {

  value = input<number | undefined>();
  orientation = input<'h' | 'v'>('h');

}
