import { supabase } from '../supabase';
import { Alert } from 'react-native';

const USER_STATISTICS_SQL = `
-- Create user_statistics table
CREATE TABLE IF NOT EXISTS public.user_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    statistics JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up RLS (Row Level Security) for the user_statistics table
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to access only their own statistics
CREATE POLICY "Users can only access their own statistics" 
    ON public.user_statistics 
    FOR ALL 
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_statistics TO authenticated;

-- Create index on user_id for faster lookup
CREATE INDEX IF NOT EXISTS idx_user_statistics_user_id ON public.user_statistics(user_id);
`;

/**
 * Sets up the necessary database tables for the application
 * This should be called once when the app initializes and can verify/create
 * any missing tables required by the app
 */
export async function setupDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    // Check if the user_statistics table exists
    const { error: checkError } = await supabase
      .from('user_statistics')
      .select('id')
      .limit(1);

    // If we get a 42P01 error, the table doesn't exist and we need to create it
    if (checkError && checkError.code === '42P01') {
      console.log('Setting up user_statistics table...');
      
      // Use raw SQL query to create the table
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: USER_STATISTICS_SQL
      });

      if (createError) {
        console.error('Error creating user_statistics table:', createError);
        return { 
          success: false, 
          message: `Failed to create database tables: ${createError.message}` 
        };
      }

      return { 
        success: true, 
        message: 'Database tables created successfully' 
      };
    }

    // If no error, the table exists
    return { 
      success: true, 
      message: 'Database tables already exist' 
    };
  } catch (error) {
    console.error('Error setting up database:', error);
    return { 
      success: false, 
      message: `Unexpected error setting up database: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Function to show a prompt to the user asking if they want to set up the database tables
 * This is useful for development environments or first-time app usage
 */
export function promptDatabaseSetup() {
  Alert.alert(
    'Database Setup',
    'Would you like to set up the required database tables for the statistics feature?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Set Up',
        onPress: async () => {
          try {
            const result = await setupDatabase();
            Alert.alert(
              result.success ? 'Success' : 'Error',
              result.message
            );
          } catch (error) {
            Alert.alert(
              'Error',
              `Failed to set up database: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        },
      },
    ],
    { cancelable: false }
  );
}
