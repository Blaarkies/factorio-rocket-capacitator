import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IS_MOBILE } from '@app/common/token/is-mobile';

@Component({
  selector: 'app-bootstrap',
  imports: [
    RouterOutlet,
  ],
  templateUrl: './bootstrap.html',
  styleUrls: ['./bootstrap.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootstrapCmp {

  protected isMobile = inject(IS_MOBILE);
  protected IS_DEBUG = true; // TODO: use token

}
