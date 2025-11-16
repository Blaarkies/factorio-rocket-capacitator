import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-simple-search-box',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './simple-search-box.html',
  styleUrl: './simple-search-box.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimpleSearchBox {

  query = output<string>();

  protected controlQuery = new FormControl<string>('');

  constructor() {
    this.controlQuery.valueChanges.pipe(
      distinctUntilChanged(),
      debounceTime(50),
      takeUntilDestroyed())
      .subscribe(v => this.query.emit(v));
  }

  protected clear() {
    this.controlQuery.setValue('');
  }
}
