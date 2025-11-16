import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { routePaths } from '@app/bootstrap/routes';

@Component({
  selector: 'app-page-navigator',
  imports: [
    RouterLink
  ],
  templateUrl: './page-navigator.html',
  styleUrl: './page-navigator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageNavigator {

  protected routes = Object.fromEntries(
    Object.entries(routePaths).map(([k, v]) => [k, `/${v}`])
  ) as typeof routePaths;
}
