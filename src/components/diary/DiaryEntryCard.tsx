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
    
    // Determine card height based on content length
    const bodyLength = entry.body.length;
    const getRowSpan = () => {
        if (bodyLength < 150) return 'row-span-1';
        if (bodyLength <= 300) return 'row-span-2';
        return 'row-span-3';
    };
    
    const getLineClamp = () => {
        if (bodyLength < 150) return 'line-clamp-4';
        if (bodyLength <= 300) return 'line-clamp-8';
        return 'line-clamp-12';
    };

    return (
         <div
             className={`group border bg-diary-card-bg transition-all duration-200 ease-in-out rounded-lg p-3 ${getRowSpan()}`}
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
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                {entryDate.toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1">

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(entry.id);
                            }}
                            className="p-0 text-muted-foreground"
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
             <div className="flex flex-col h-full overflow-hidden relative">
                 <p className={`text-xs text-muted-foreground whitespace-pre-wrap flex-1 ${getLineClamp()}`}>
                     {entry.body}
                 </p>
             </div>
        </div>
    );
};
