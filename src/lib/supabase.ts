
// Re-export the Supabase client from the integration file
import { supabase } from "@/integrations/supabase/client";

// Helper function to reset database (for demo purposes)
export const resetDatabase = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    // This is a simple implementation. In a real app, you might want to call
    // a Supabase Edge Function that resets the database
    const { error } = await supabase.rpc('reset_database', {});
    
    if (error) {
      return { 
        success: false, 
        message: error.message 
      };
    }
    
    return { 
      success: true 
    };
  } catch (error) {
    console.error('Error resetting database:', error);
    return { 
      success: false, 
      message: 'An unexpected error occurred' 
    };
  }
};

export { supabase };

