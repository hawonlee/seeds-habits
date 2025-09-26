import React from 'react';
import { format } from 'date-fns';
import { Plus, Home, ChevronLeft } from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import type { Database } from '@/integrations/supabase/types';

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];

interface DiarySidebarProps {
    diaryEntries: DiaryEntry[];
    currentEntryId: string;
    onNavigateToEntry?: (entryId: string) => void;
    onCreateNewEntry?: () => void;
    onNavigateHome?: () => void;
}

export const DiarySidebar: React.FC<DiarySidebarProps> = ({
    diaryEntries,
    currentEntryId,
    onNavigateToEntry,
    onCreateNewEntry,
    onNavigateHome
}) => {
    return (
        <Sidebar collapsible="offcanvas" className="transition-all duration-100 ease-in-out">
            <SidebarContent>
                {/* Home Button */}
                {onNavigateHome && (
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                     <SidebarMenuButton
                                         size="sm"
                                         onClick={onNavigateHome}
                                         className="bg-background hover:bg-muted p-1 mt-2 hover:text-muted-foreground transition-all duration-200 ease-in-out"
                                     >
                                        <div className="flex items-center gap-2 w-full">
                                            <ChevronLeft className="h-4 w-4" />
                                            <span className="font-xs text-sm">Back</span>
                                        </div>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                <SidebarGroup>
                    <div className="flex items-center justify-between">
                        <SidebarGroupLabel>All Entries</SidebarGroupLabel>
                         <SidebarMenuButton
                             size="sm"
                             isActive={currentEntryId === 'new'}
                             onClick={onCreateNewEntry}
                             className="h-auto w-fit p-3 text-primary hover:text-primary transition-all duration-200 ease-in-out data-[active=true]:bg-button-ghost-hover data-[active=true]:text-muted-foreground"
                         >
                            <div className="flex items-center gap-2 w-full">
                                <Plus className="h-4 w-4" />
                            </div>
                        </SidebarMenuButton>
                    </div>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {/* Create New Entry */}
                            <SidebarMenuItem>

                            </SidebarMenuItem>

                            {/* Existing Entries */}
                            {diaryEntries
                                .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
                                .map((diaryEntry) => (
                                    <SidebarMenuItem key={diaryEntry.id}>
                                         <SidebarMenuButton
                                             size="sm"
                                             isActive={diaryEntry.id === currentEntryId}
                                             onClick={() => onNavigateToEntry?.(diaryEntry.id)}
                                             className="h-auto p-3 transition-all duration-200 ease-in-out data-[active=true]:bg-button-ghost-hover"
                                         >
                                            <div className="flex items-start gap-2 w-full">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm truncate">
                                                        {diaryEntry.title}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {format(new Date(diaryEntry.entry_date), "MMM d, yyyy")}
                                                    </div>
                                                </div>
                                            </div>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
};
