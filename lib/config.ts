// Environment configuration for the app
// In a production app, these would be loaded from environment variables
// or a secure storage solution

// Configuration for different environments
interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  googleCloudVisionApiKey: string;
}

// Development environment configuration
const devConfig: AppConfig = {
  supabaseUrl: "https://vnqkmupofqfyfuwwpqlq.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZucWttdXBvZnFmeWZ1d3dwcWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNzUzNjgsImV4cCI6MjA1OTk1MTM2OH0.v9f7taMsBIiZncCWwQs8p2pUVnXiCcL54KlQqGJbpYM",
  googleCloudVisionApiKey: 'AIzaSyCJecjZCDrCTHGHYBVMWTP9fr0COAd13zA', // Replace with your actual API key
};

// Production environment configuration
const prodConfig: AppConfig = {
  supabaseUrl: "https://vnqkmupofqfyfuwwpqlq.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZucWttdXBvZnFmeWZ1d3dwcWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNzUzNjgsImV4cCI6MjA1OTk1MTM2OH0.v9f7taMsBIiZncCWwQs8p2pUVnXiCcL54KlQqGJbpYM",
  googleCloudVisionApiKey: 'AIzaSyCJecjZCDrCTHGHYBVMWTP9fr0COAd13zA', // Replace with your actual API key
};

// Determine which configuration to use based on environment
const isDevelopment = process.env.NODE_ENV !== 'production';
export const config: AppConfig = isDevelopment ? devConfig : prodConfig;

