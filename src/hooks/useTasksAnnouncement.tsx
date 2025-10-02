import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useTasksAnnouncement = () => {
  const { user } = useAuth();
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAnnouncementStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check if user has seen the tasks announcement
        const { data, error } = await supabase
          .from('user_preferences')
          .select('tasks_announcement_seen')
          .eq('user_id', user.id)
          .maybeSingle() as { data: { tasks_announcement_seen: boolean } | null; error: any };

        if (error) {
          console.error('Error checking announcement status:', error);
          // Show announcement as fallback on any error
          setShowAnnouncement(true);
        } else {
          // If no preference record exists or tasks_announcement_seen is false, show announcement
          if (!data || !data.tasks_announcement_seen) {
            setShowAnnouncement(true);
          }
        }
      } catch (err) {
        console.error('Error checking announcement status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAnnouncementStatus();
  }, [user]);

  const markAnnouncementAsSeen = async () => {
    console.log('useTasksAnnouncement: markAnnouncementAsSeen called');
    if (!user) return;

    try {
      console.log('useTasksAnnouncement: Updating database for user:', user.id);
      // Upsert the user preference to mark announcement as seen
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          tasks_announcement_seen: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error marking announcement as seen:', error);
        // Still hide the popup even if database update fails
        setShowAnnouncement(false);
        return;
      }

      console.log('useTasksAnnouncement: Database updated successfully');
      setShowAnnouncement(false);
    } catch (err) {
      console.error('Error marking announcement as seen:', err);
      // Still hide the popup even if database update fails
      setShowAnnouncement(false);
    }
  };

  return {
    showAnnouncement,
    loading,
    markAnnouncementAsSeen
  };
};
