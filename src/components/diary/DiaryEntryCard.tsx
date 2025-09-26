import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Edit, Trash2 } from 'lucide-react';
import { getCategoryById } from '@/lib/categories';
import type { Database } from '@/integrations/supabase/types';

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];

interface DiaryEntryCardProps {
    entry: DiaryEntry;
    onEdit: (entry: DiaryEntry) => void;
    onDelete: (id: string) => void;
}

export const DiaryEntryCard: React.FC<DiaryEntryCardProps> = ({ entry, onEdit, onDelete }) => {
    const entryDate = new Date(entry.entry_date);
    const updatedDate = new Date(entry.updated_at);

    return (
         <div
             className="group border bg-background transition-all duration-200 ease-in-out rounded-lg p-3"
             onClick={() => onEdit(entry)}
         >
            <div className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="text-sm">{entry.title}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                            {entry.category !== 'none' && (
                                <Badge categoryId={entry.category}>
                                    {getCategoryById(entry.category)?.name || entry.category}
                                </Badge>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-xs">
                                <Calendar className="h-3 w-3" />
                                {entryDate.toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1">

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(entry.id);
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex items-center gap-2">

                    {/* {updatedDate.getTime() !== entryDate.getTime() && (
            <span className="text-xs text-muted-foreground">
              Edited {updatedDate.toLocaleDateString()}
            </span>
          )} */}
                </div>
            </div>
             {/* Body Overview */}
             <div className="flex flex-col h-full max-h-16 overflow-hidden relative">
                 <p className="text-xs text-muted-foreground whitespace-pre-wrap flex-1">
                     {entry.body}
                 </p>
                 {/* Fade gradient overlay - always at bottom */}
                 {/* <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-habitbg to-transparent group-hover:from-habitbghover pointer-events-none transition-all duration-200 ease-in-out" /> */}
             </div>
        </div>
    );
};
