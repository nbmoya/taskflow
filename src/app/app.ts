import { Component, signal } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
//import { TaskList } from './tasks/task-list/task-list';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('taskflow');
}
