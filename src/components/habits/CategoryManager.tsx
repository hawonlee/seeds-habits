import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Palette, LayoutGrid, Settings2 } from 'lucide-react';
import { Category, fetchCategories, getCategories, setCategoriesCache, addCacheChangeListener, refreshCategories } from '@/lib/categories';
import { invalidateHabitsCacheForUser } from '@/hooks/useHabits';
import { useAuth } from '@/hooks/useAuth';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { COLOR_OPTIONS, findColorOptionByValue } from '@/lib/colorOptions';
import { getCategoryCSSVariables } from '@/lib/categories';

interface CategoryManagerProps {
  onCategoryChange?: (categories: Category[]) => void;
  adoptionThreshold?: number;
  onChangeAdoptionThreshold?: (threshold: number) => void;
}

export const CategoryManager = ({ onCategoryChange, adoptionThreshold, onChangeAdoptionThreshold }: CategoryManagerProps) => {
  const [categories, setCategories] = useState<Category[]>(getCategories());
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    color: '#3B82F6'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const { user } = useAuth();
  useEffect(() => {
    if (user) {
      loadCategories(user.id);
    } else {
      setCategories([]);
    }
  }, [user]);

  // Listen for cache changes from other components
  useEffect(() => {
    const unsubscribe = addCacheChangeListener(() => {
      setCategories(getCategories());
    });
    return unsubscribe;
  }, []);

  const loadCategories = async (userId: string) => {
    setLoading(true);
    try {
      const fetchedCategories = await fetchCategories(userId);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const colorOptions = COLOR_OPTIONS.map((color, index) => ({
    ...color,
    cssBg: `hsl(var(--category-${index + 1}-bg))`,
    cssPrimary: `hsl(var(--category-${index + 1}-primary))`
  }));

  const handleAddCategory = async () => {
    if (newCategory.name && newCategory.color) {
      const palette = findColorOptionByValue(newCategory.color);
      const category: Category = {
        id: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
        name: newCategory.name,
        color: newCategory.color,
        bgColor: palette ? palette.bgHex : '#FAFAFA',
        textColor: palette ? palette.textHex : '#262626'
      };

      try {
        const result: any = await supabase
          .from('categories')
          .insert({
            id: category.id,
            name: category.name,
            color: category.color,
            bg_color: category.bgColor,
            text_color: category.textColor,
            user_id: user?.id || null
          });
        const { error } = result;

        if (error) {
          toast({
            title: "Error",
            description: `Failed to add category: ${error.message}`,
            variant: "destructive",
          });
          return;
        }

        // Force refresh all components using categories
        await refreshCategories(user?.id);
        setNewCategory({ name: '', color: '#3B82F6' });
        onCategoryChange?.(getCategories());

        // Removed success toast per request
      } catch (error) {
        console.error('Error adding category:', error);
        toast({
          title: "Error",
          description: "Failed to add category",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({ name: category.name, color: category.color });
    setOpenPopoverId(category.id);
  };

  const handleUpdateCategory = async () => {
    if (editingCategory && newCategory.name && newCategory.color) {
      const palette = findColorOptionByValue(newCategory.color);
      const updatedCategory: Category = {
        ...editingCategory,
        name: newCategory.name,
        color: newCategory.color,
        bgColor: palette ? palette.bgHex : '#FAFAFA',
        textColor: palette ? palette.textHex : '#262626'
      };

      try {
        // @ts-ignore - Type instantiation is excessively deep
        const result: any = await supabase
          .from('categories')
          .update({
            name: updatedCategory.name,
            color: updatedCategory.color,
            bg_color: updatedCategory.bgColor,
            text_color: updatedCategory.textColor
          })
          .eq('id', editingCategory.id)
          .eq('user_id', user?.id || '');
        const { error } = result;

        if (error) {
          toast({
            title: "Error",
            description: `Failed to update category: ${error.message}`,
            variant: "destructive",
          });
          return;
        }

        // Force refresh all components using categories
        await refreshCategories(user?.id);
        setEditingCategory(null);
        setNewCategory({ name: '', color: '#3B82F6' });
        onCategoryChange?.(getCategories());

        // Removed success toast per request
      } catch (error) {
        console.error('Error updating category:', error);
        toast({
          title: "Error",
          description: "Failed to update category",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // First, update all habits that use this category to "none"
      const habitsUpdateResult = await supabase
        .from('habits')
        .update({ category: 'none' })
        .eq('category', categoryId)
        .eq('user_id', user?.id || '');

      if (habitsUpdateResult.error) {
        toast({
          title: "Error",
          description: `Failed to update habits: ${habitsUpdateResult.error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Then delete the category
      const categoryDeleteResult = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user?.id || '');

      if (categoryDeleteResult.error) {
        toast({
          title: "Error",
          description: `Failed to delete category: ${categoryDeleteResult.error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Force refresh all components using categories
      await refreshCategories(user?.id);

      // Invalidate habits cache so affected habits refresh
      if (user?.id) {
        invalidateHabitsCacheForUser(user.id);
      }

      onCategoryChange?.(getCategories());

      // Removed success toast per request
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setNewCategory({ name: '', color: '#3B82F6' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghosticon" size="icon" className="">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">


        <div className="space-y-6">
          {/* Existing Categories */}
          <div>
            <div className="flex items-center justify-start gap-1 mb-4">
              <h3 className="text-xs font-medium">Current Categories</h3>
              <Popover
                onOpenChange={(open) => {
                  if (open) {
                    setNewCategory({ name: '', color: '#3B82F6' });
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button size="icon" variant="ghosticon" className="">
                    <Plus className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-3">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium">Name</label>
                      <Input
                        placeholder="Category name"
                        value={newCategory.name || ''}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-2 block">Color</label>
                      <div className="grid grid-cols-3 gap-2">
                        {colorOptions.map(color => (
                          <button
                            key={color.value}
                            onClick={() => setNewCategory({ ...newCategory, color: color.value })}
                            className={`w-full h-10 rounded-md border-2 transition-all ${newCategory.color === color.value ? '' : 'border-transparent'}`}
                            style={{
                              backgroundColor: color.cssBg,
                              '--dark-bg': color.cssBg,
                              '--light-border': color.cssPrimary,
                              '--dark-border': color.cssPrimary,
                              borderColor: newCategory.color === color.value ? 'var(--light-border)' : 'transparent'
                            } as React.CSSProperties & { '--dark-bg': string; '--light-border': string; '--dark-border': string }}
                            data-dark-bg={color.cssPrimary}
                            data-light-border={newCategory.color === color.value ? color.cssPrimary : undefined}
                            data-dark-border={newCategory.color === color.value ? color.cssBg : undefined}
                            aria-label={color.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        disabled={!newCategory.name || !newCategory.color}
                        onClick={async () => {
                          await handleAddCategory();
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {categories.filter(category => category.id !== 'none').map(category => (
                <div key={category.id} className="flex items-center justify-between bg-habitbg/50 p-3 rounded-lg">
                  <Popover
                    open={openPopoverId === category.id}
                    onOpenChange={(open) => {
                      if (open) {
                        setEditingCategory(category);
                        setNewCategory({ name: category.name, color: category.color });
                        setOpenPopoverId(category.id);
                      } else {
                        setOpenPopoverId(null);
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-3 focus:outline-none">
                        {(() => {
                          const cssVars = getCategoryCSSVariables(category.id);
                          return (
                            <>
                              {/* <div className="w-5 h-5 rounded-sm border" style={{ backgroundColor: cssVars.bg, borderColor: cssVars.primary }} /> */}
                              <Badge categoryId={category.id} className="text-xs p-1 px-2">
                                {category.name}
                              </Badge>
                            </>
                          );
                        })()}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-64 p-3">
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium">Name</label>
                          <Input
                            value={newCategory.name || ''}
                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-2 block">Color</label>
                          <div className="grid grid-cols-3 gap-2">
                            {colorOptions.map(color => (
                              <button
                                key={color.value}
                                onClick={() => setNewCategory({ ...newCategory, color: color.value })}
                                className={`w-full h-10 rounded-md border-2 transition-all ${newCategory.color === color.value ? '' : 'border-transparent'}`}
                                style={{
                                  backgroundColor: color.cssBg,
                                  '--dark-bg': color.cssBg,
                                  '--light-border': color.cssPrimary,
                                  '--dark-border': color.cssPrimary,
                                  borderColor: newCategory.color === color.value ? 'var(--light-border)' : 'transparent'
                                } as React.CSSProperties & { '--dark-bg': string; '--light-border': string; '--dark-border': string }}
                                data-dark-bg={color.cssPrimary}
                                data-light-border={newCategory.color === color.value ? color.cssPrimary : undefined}
                                data-dark-border={newCategory.color === color.value ? color.cssBg : undefined}
                                aria-label={color.name}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setOpenPopoverId(null);
                              setEditingCategory(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            disabled={!newCategory.name || !newCategory.color}
                            onClick={async () => {
                              await handleUpdateCategory();
                              setOpenPopoverId(null);
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteCategory(category.id)}>
                      <Trash2 className="h-4 w-4 text-neutral-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Global Adoption Threshold */}
          <div className="">
            <h3 className="text-xs font-medium mb-2">Adoption Threshold</h3>
            <p className="text-xs text-muted-foreground mb-3">Number of days a habit must be completed to become adopted.</p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={365}
                value={adoptionThreshold ?? 21}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (onChangeAdoptionThreshold && !Number.isNaN(val)) {
                    onChangeAdoptionThreshold(val);
                  }
                }}
                className="w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-xs text-muted-foreground">days</span>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};
