import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export const DatabaseTest = () => {
  const [testResult, setTestResult] = useState<string>('');
  const { user } = useAuth();

  const testTableExists = async () => {
    try {
      console.log('Testing if habits table exists...');
      
      // Try to select from the table
      const { data, error } = await supabase
        .from('habits')
        .select('count')
        .limit(1);

      console.log('Table test result:', { data, error });

      if (error) {
        if (error.code === '42P01') {
          setTestResult('❌ Table does not exist. Please run the migration first.');
        } else {
          setTestResult(`❌ Error: ${error.message}`);
        }
      } else {
        setTestResult('✅ Table exists and is accessible!');
      }
    } catch (error) {
      console.error('Test error:', error);
      setTestResult(`❌ Exception: ${error}`);
    }
  };

  const testInsert = async () => {
    if (!user) {
      setTestResult('❌ No authenticated user found. Please sign in first.');
      return;
    }

    try {
      console.log('Testing insert for user:', user.id);
      
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          title: 'Test Habit',
          category: 'test',
          target_frequency: 1,
          leniency_threshold: 1,
          phase: 'future',
          streak: 0,
          total_completions: 0,
          points: 0,
        })
        .select()
        .single();

      console.log('Insert test result:', { data, error });

      if (error) {
        setTestResult(`❌ Insert failed: ${error.message}`);
      } else {
        setTestResult('✅ Insert successful!');
        
        // Clean up the test record
        await supabase
          .from('habits')
          .delete()
          .eq('id', data.id);
      }
    } catch (error) {
      console.error('Insert test error:', error);
      setTestResult(`❌ Insert exception: ${error}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-neutral-50">
      <h3 className="text-lg font-semibold mb-4">Database Connection Test</h3>
      <div className="space-y-2">
        <Button onClick={testTableExists} variant="outline" className="mr-2">
          Test Table Exists
        </Button>
        <Button onClick={testInsert} variant="outline">
          Test Insert
        </Button>
      </div>
      {testResult && (
        <div className="mt-4 p-3 bg-white border rounded">
          <pre className="text-sm">{testResult}</pre>
        </div>
      )}
    </div>
  );
};
