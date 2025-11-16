import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-sandbox',
  templateUrl: './sandbox.html',
  styleUrl: './sandbox.scss',
  imports: [
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class SandboxPage {

}
