import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { firstValueFrom, fromEvent, map, merge, skip, take, timer } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { WA_NAVIGATOR } from '@ng-web-apis/common';

export type IdKey = number | string;
export type Sorting = 'asc' | 'desc';

type RankedDirection = { rank: number; direction: Sorting };

@Component({
  selector: 'app-table-selection',
  imports: [ScrollingModule],
  templateUrl: './table-selection.component.html',
  styleUrl: './table-selection.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableSelection<T extends { id: IdKey }> {

  list = input.required<T[]>();
  headers = input<string[]>([]);
  rowKeys = input<(keyof T)[]>([]);
  masterColumn = input<keyof T>();

  sortableKeys = input<(keyof T)[]>([]);
  sorting = input<[(keyof T), Sorting][]>([]);

  itemSize = input(30);
  itemsVisible = input(10);
  singleSelect = input(false);
  showSelectionTools = input(false);

  select = output<Map<IdKey, T>>();
  sort = output<[keyof T, Sorting][]>();

  protected gridColumns = computed(() => {
    const masterKey = this.masterColumn();
    const keys = this.rowKeys();

    const defaultColumn = 'minmax(6ch, auto)';
    const columns = masterKey
      ? keys.map(k => k === masterKey ? 'max-content' : defaultColumn)
        .join(' ')
      : `repeat(${keys.length}, ${defaultColumn})`;
    return columns;
  });

  protected rows = computed(() => {
    const list = this.list() ?? [];
    const keys = this.rowKeys();

    return list.map(item => ({
      item,
      cells: keys.map(k => item[k] ?? item),
    }));
  });

  protected headerRowKeyMap = computed(() => {
    const headers = this.headers();
    const keys = this.sortableKeys();
    return new Map(keys.map((k, ki) => [
      headers.find((h, hi) => ki === hi),
      k,
    ]));
  });

  private selectedItems = signal(new Map<IdKey, T>(), {
    equal: () => false
  });

  private sortingState = signal(new Map<keyof T, RankedDirection>(), {
    equal: () => false
  });

  selection = this.selectedItems.asReadonly();

  protected headerSorting = computed(() => {
    let state = this.sortingState();
    let headerKeyMap = this.headerRowKeyMap();

    return new Map(state.entries().map(([key, {direction}]) => [
      headerKeyMap.entries().find(e => e[1] === key)[0],
      direction]));
  });

  private previousIndex: number;
  private longPressThresholdMs = 300;
  private destroyRef = inject(DestroyRef);
  private navigator = inject(WA_NAVIGATOR);

  constructor() {
    toObservable(this.list).pipe(skip(1))
      .subscribe(inputList => {
        let idTest = inputList[0];
        if (!idTest?.hasOwnProperty('id')) {
          this.selectedItems.update(map => {
            map.clear();
            return map;
          });
        }

        this.selectedItems.update(map => {
          let filtered = inputList.filter(item => map.has(item.id));
          return new Map(filtered.map(item => [item.id, item]));
        });
      });

    toObservable(this.selectedItems).pipe(skip(2))
      .subscribe(selectionMap => this.select.emit(selectionMap));

    toObservable(this.sortingState).pipe(skip(1))
      .subscribe(sortingMap => {
        let ranked: [keyof T, Sorting][] = sortingMap.entries().toArray()
          .sort(([,a],[,b]) => b.rank - a.rank)
          .map(([key,{direction}]) => [key, direction]);
        this.sort.emit(ranked);
      });

    toObservable(this.sorting)
      .subscribe(sorting => {
        let state = this.sortingState();
        state.clear();
        sorting.forEach(([key, direction], rank) =>
          state.set(key, {direction, rank}));
        this.sortingState.set(state);
      });
  }

  protected async actionItem(eDown: PointerEvent, item: T) {
    const selectionMap = this.selectedItems();

    if (this.singleSelect()) {
      selectionMap.clear();
      selectionMap.set(item.id, item);
      this.selectedItems.set(selectionMap);
      return;
    }

    const lastUsedIndex = this.previousIndex;
    this.previousIndex = this.list().indexOf(item);

    let pointerup$ = fromEvent(eDown.target, 'pointerup')
      .pipe(map(() => false));
    let pressTimeout$ = timer(this.longPressThresholdMs)
      .pipe(map(() => true));

    let isLongPress$ = merge(pointerup$, pressTimeout$)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef));
    let isLongPress = await firstValueFrom(isLongPress$);

    this.navigator.vibrate?.(1);

    const isRangeSelect = eDown.shiftKey || isLongPress;
    if (isRangeSelect && lastUsedIndex >= 0) {
      const iA = lastUsedIndex;
      const iB = this.previousIndex;

      const [a, b] = [Math.min(iA, iB), Math.max(iA, iB)];
      this.list().slice(a, b + 1)
        .forEach(item => selectionMap.set(item.id, item));
      this.selectedItems.set(selectionMap);
      return;
    }

    const isIncrementalSelect = eDown.ctrlKey || eDown.pointerType !== 'mouse';
    if (isIncrementalSelect) {
      if (selectionMap.has(item.id)) {
        selectionMap.delete(item.id);
      } else {
        selectionMap.set(item.id, item);
      }
      this.selectedItems.set(selectionMap);
      return;
    }

    const newMap = new Map();
    if (!selectionMap.has(item.id)) {
      newMap.set(item.id, item);
    }
    this.selectedItems.set(newMap);
  }

  protected selectAll() {
    if (this.singleSelect()) {
      return;
    }
    this.selectedItems.set(new Map(
      this.list().map(item => [item.id, item])
    ));
  }

  protected selectNone() {
    this.selectedItems.update(map => {
      map.clear();
      return map;
    });
  }

  protected setSorting(rowKey: keyof T) {
    let state = this.sortingState();

    if (state.has(rowKey)) {
      let oldSorting = state.get(rowKey);
      if (oldSorting.direction === 'asc') {
        state.set(rowKey, {...oldSorting, direction: 'desc'});
      } else {
        state.delete(rowKey);
      }
      this.sortingState.set(state);
      return;
    }

    let maxRank = Math.max(...state.values().map(s => s.rank).toArray());
    state.set(rowKey, {rank: maxRank + 1, direction: 'asc'});
    this.sortingState.set(state);
  }

}
