import { Injectable } from '@angular/core';

import { supabase } from '../supabase.client';

import { TaskModel, TaskDraft } from './task.model';


@Injectable({ providedIn: 'root' })

export class TaskApi {

    async loadAll(): Promise<TaskModel[]> {

        const { data, error } = await supabase

            .from('tasks')

            .select('*')

            .order('id');

        if (error) throw error;

        return (data ?? []) as TaskModel[];

    }


    async add(draft: TaskDraft): Promise<TaskModel> {

        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase

            .from('tasks')

            .insert({ ...draft, user_id: user?.id })

            .select()

            .single();                 // devuelve la fila creada 

        if (error) throw error;

        return data as TaskModel;

    }


    async update(id: number, patch: Partial<TaskModel>): Promise<void> {

        const { error } = await supabase

            .from('tasks')

            .update(patch)

            .eq('id', id);

        if (error) throw error;

    }

    async remove(id: number): Promise<void> {

        const { error } = await supabase

            .from('tasks')

            .delete()

            .eq('id', id);

        if (error) throw error;

    }

}