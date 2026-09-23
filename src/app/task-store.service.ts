import {
  Injectable,
  effect,
  inject,
  signal
} from '@angular/core';

import type {
  RealtimePostgresChangesPayload
} from '@supabase/supabase-js';

import {
  TaskModel,
  TaskDraft
} from './tasks/task.model';

import { TaskApi } from './tasks/task-api.service';
import { supabase } from './supabase.client';

@Injectable({
  providedIn: 'root'
})
export class TaskStore {

  private readonly api = inject(TaskApi);

  readonly tasks = signal<TaskModel[]>([]);
  readonly loading = signal(true);

  private readonly currentUserId =
    signal<string | null | undefined>(null);

  setUser(uid: string | undefined): void {
    this.currentUserId.set(uid);
  }

  constructor() {

    effect(() => {

      const uid = this.currentUserId();

      if (uid === null || uid === undefined) {
        return;
      }

      this.load();
    });
  }

  async load(): Promise<void> {

    this.loading.set(true);

    try {
      this.tasks.set(
        await this.api.loadAll()
      );
    } finally {
      this.loading.set(false);
    }
  }

  find(id: number): TaskModel | undefined {

    return this.tasks()
      .find(t => t.id === id);
  }

  async add(
    draft: TaskDraft
  ): Promise<TaskModel> {

    const created = await this.api.add(draft);

    this.tasks.update(list => [
      ...list,
      created
    ]);

    return created;
  }

  async update(
    id: number,
    patch: Partial<TaskModel>
  ): Promise<void> {

    await this.api.update(id, patch);

    this.tasks.update(list =>
      list.map(t =>
        t.id === id
          ? { ...t, ...patch }
          : t
      )
    );
  }

  async remove(id: number): Promise<void> {

    await this.api.remove(id);

    this.tasks.update(list =>
      list.filter(t => t.id !== id)
    );
  }

  subscribeRealtime(): void {

    supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload: RealtimePostgresChangesPayload<TaskModel>) => {
          this.applyChange(payload);
        }
      )
      .subscribe();
  }

  private applyChange(
    p: RealtimePostgresChangesPayload<TaskModel>
  ): void {

    switch (p.eventType) {

      case 'INSERT': {

        const task = p.new;

        this.tasks.update(ts =>
          ts.some(t => t.id === task.id)
            ? ts
            : [...ts, task]
        );

        break;
      }

      case 'UPDATE': {

        const task = p.new;

        this.tasks.update(ts =>
          ts.map(t =>
            t.id === task.id
              ? task
              : t
          )
        );

        break;
      }

      case 'DELETE': {

        const id = p.old.id;

        this.tasks.update(ts =>
          ts.filter(t => t.id !== id)
        );

        break;
      }
    }
  }
}
