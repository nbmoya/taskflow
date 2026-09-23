import { Component, computed, inject, input, numberAttribute } from '@angular/core';
import { statusLabel } from '../task-status';
import { RouterLink } from '@angular/router';
import { Taskstore } from '../../task-store.service';


@Component({
  imports: [RouterLink],
  selector: 'app-task-detail',
  styleUrl: './task-detail.css',
  templateUrl: './task-detail.html',
})
export class TaskDetail {
  taskId = input.required({transform:numberAttribute});

  private readonly store = inject(Taskstore);

  task = computed( () => this.store.tasks().find(t => t.id === this.taskId()));

  label = statusLabel;


}
