import { useState } from "react";
import { supabase } from "../utils/supabase";

export const useSupabase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeQuery = async (operation) => {
    setLoading(true);
    setError(null);
    try {
      const result = await operation(supabase);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, executeQuery };
};
