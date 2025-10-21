import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EllipsisVertical } from 'lucide-react';
import { COLOR_OPTIONS, findColorOptionByValue } from '@/lib/colorOptions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { refreshCategories, type Category } from '@/lib/categories';
import { useAuth } from '@/hooks/useAuth';

type CategoryEditButtonProps = {
  category: any; // narrow via runtime usage to avoid deep instantiation issue
  onUpdated?: () => void;
};

export function CategoryEditButton({ category, onUpdated }: CategoryEditButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color || '#3B82F6');
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const palette = findColorOptionByValue(color);
      // @ts-ignore - Avoid deep generic instantiation from supabase types
      const { error } = await supabase
        .from('categories')
        .update({
          name,
          color,
          bg_color: palette ? palette.bgHex : '#FAFAFA',
          text_color: palette ? palette.textHex : '#262626',
        })
        .eq('id', category.id)
        .eq('user_id', user?.id || '');
      if (error) throw error;
      await refreshCategories(user?.id);
      setOpen(false);
      onUpdated?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to update category', variant: 'destructive' });
    }
  };

  // Don’t allow editing the special "none" category
  const disabled = category.id === 'none';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="smallicon"
          className="h-6 w-6 ml-1"
          title="Edit category"
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
          disabled={disabled}
        >
          <EllipsisVertical className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium mb-2 block">Color</label>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setColor(opt.value)}
                  className={`w-full h-9 rounded-md border-2 transition-all ${color === opt.value ? '' : 'border-transparent'}`}
                  style={{ backgroundColor: opt.bgHex, borderColor: color === opt.value ? opt.textHex : 'transparent' }}
                  aria-label={opt.name}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={!name.trim()} onClick={handleSave}>Save</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default CategoryEditButton;


