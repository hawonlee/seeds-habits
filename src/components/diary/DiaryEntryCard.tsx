import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Edit } from 'lucide-react';
import { getCategoryById } from '@/lib/categories';
import type { Database } from '@/integrations/supabase/types';

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];

interface DiaryEntryCardProps {
    entry: DiaryEntry;
    onEdit: (entry: DiaryEntry) => void;
    isActive?: boolean;
}

export const DiaryEntryCard: React.FC<DiaryEntryCardProps> = ({ entry, onEdit, isActive }) => {
    const entryDate = new Date(`${entry.entry_date}T00:00:00`);
    const updatedDate = new Date(entry.updated_at);
    
    // Fixed single-row height and single-line preview
    const getRowSpan = () => 'row-span-1';

    const getFirstLineText = (html: string): string => {
        if (!html) return '';
        // Normalize HTML line breaks to newlines, strip remaining tags, then take first line
        const normalized = html
            .replace(/<br\s*\/?\s*>/gi, '\n')
            .replace(/<\/?(div|p)[^>]*>/gi, '')
            .replace(/<[^>]+>/g, '');
        const firstLine = normalized.split(/\r?\n/)[0] || '';
        return firstLine.trim();
    };

    return (
         <div
             className={`group bg-habitbg transition-all duration-200 ease-in-out rounded-lg p-3 w-full hover:cursor-pointer ${isActive ? 'bg-habitbghover' : 'bg-habitbg'} ${getRowSpan()}`}
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
                    <div className="flex gap-1" />
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
                <p className="text-xs text-muted-foreground max-w-full block truncate">
                    {getFirstLineText(entry.body)}
                </p>
            </div>
        </div>
    );
};
