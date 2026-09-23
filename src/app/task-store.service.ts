import { Injectable, signal } from "@angular/core";
import { supabase } from "./supabase.client";
import { TaskModel, TaskDraft, TaskPatch } from "./tasks/task.model";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";

@Injectable({providedIn: 'root'})
export class Taskstore{
    private readonly db = supabase;
    readonly tasks = signal<TaskModel[]>([]);
    readonly loading = signal(true);
    

    init() {
        this.load();
        this.db
            .channel('tasks-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                payload => this.applyChange(payload)
            )
            .subscribe();
    }

    async load(): Promise<void> {
        const { data, error } = await this.db
            .from('tasks')
            .select('*')
            .order('id');
            
        if (error) throw error;
        this.tasks.set(data ?? []);
        this.loading.set(false);
    }

    async add(title: string) {
        const { data: { user } } = await this.db.auth.getUser();
        const { data, error } = await this.db 
            .from('tasks')
            .insert({title, user_id:user?.id})
            .select().single();
            if(error) throw error;
            this.tasks.update(ts => [...ts, data]);
    }
    
    async update(id:number, patch:TaskPatch){
        const {error} = await this.db
        .from('tasks').update(patch).eq('id',id);
        if(!error) this.tasks.update(ts => ts.map(t => t.id === id ? {...t, ...patch}: t))
    }

    async remove(id:number){
        const {error} = await this.db
        .from('tasks').delete().eq('id', id);
        if(!error) this.tasks.update(ts => ts.filter(t => t.id !== id))
    }

    private applyChange(p: any){
        switch(p.eventType){
            case 'INSERT':
                this.tasks.update(ts => ts.some(t => t.id === p.new.id) ? ts:[...ts, p.new]);
                break;
            case 'UPDATE':
                this.tasks.update(ts => ts.map(t => t.id === p.new.id ? p.new:t));
                break;
            case 'DELETE':
                this.tasks.update(ts => ts.filter(t => t.id !== p.old.id));
                break;
        }
    }

}

