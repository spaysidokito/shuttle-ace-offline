import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = 'https://hhebwanqcvzflofkpgtv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZWJ3YW5xY3Z6ZmxvZmtwZ3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTg3ODksImV4cCI6MjA4OTg3NDc4OX0.UqwBERUA01UXxPVk_QjFszapSlSuDfwDOuFgxYo3z6c';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
