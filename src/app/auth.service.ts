import { Injectable, effect, inject, signal } from "@angular/core";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase.client";
import { TaskStore } from "./task-store.service";

@Injectable({providedIn:'root'})
export class AuthService{
    private readonly store = inject(TaskStore);

    readonly session = signal<Session | null>(null);

    constructor(){
        supabase.auth.getSession().then(({data}) => this.session.set(data.session));

        supabase.auth.onAuthStateChange((_, s) => this.session.set(s));

        effect(()=> {
            const s = this.session;
            this.store.setUser(s()?.user.id);
            if (s()) this.store.subscribeRealtime();
        });
    }

    login(){
        return supabase.auth.signInWithOAuth({provider:'github'})
    }

    logout(){
        return supabase.auth.signOut();
    }
}
