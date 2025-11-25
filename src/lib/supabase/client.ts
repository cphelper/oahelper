import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    'https://spjkugnxvomrsaapfbgx.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwamt1Z254dm9tcnNhYXBmYmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTQ1OTgsImV4cCI6MjA3OTU3MDU5OH0.yuRWIWb9iwywBse-yy6NRXGlj23IxhleSs4vyO--wzg'
  )
}


