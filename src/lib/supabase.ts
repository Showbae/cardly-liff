import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL as string
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY as string

console.log('URL:', supabaseUrl)
console.log('KEY:', supabaseKey)

export const supabase = createClient(supabaseUrl, supabaseKey)