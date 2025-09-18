import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Palette, LayoutGrid } from 'lucide-react';
import { Category, fetchCategories, getCategories } from '@/lib/categories';
import { useAuth } from '@/hooks/useAuth';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { COLOR_OPTIONS, findColorOptionByValue } from '@/lib/colorOptions';

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

  const colorOptions = COLOR_OPTIONS;

  const handleAddCategory = async () => {
    if (newCategory.name && newCategory.color) {
      const category: Category = {
        id: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
        name: newCategory.name,
        color: newCategory.color,
        bgColor: findColorOptionByValue(newCategory.color)?.bg || 'bg-gray-100',
        textColor: findColorOptionByValue(newCategory.color)?.text || 'text-gray-800'
      };
      
      try {
        const { error } = await supabase
          .from('categories')
          .insert({
            id: category.id,
            name: category.name,
            color: category.color,
            bg_color: category.bgColor,
            text_color: category.textColor,
            user_id: user?.id || null
          });

        if (error) {
          toast({
            title: "Error",
            description: `Failed to add category: ${error.message}`,
            variant: "destructive",
          });
          return;
        }

        const updatedCategories = [...categories, category];
        setCategories(updatedCategories);
        setNewCategory({ name: '', color: '#3B82F6' });
        onCategoryChange?.(updatedCategories);
        
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
      const updatedCategory: Category = {
        ...editingCategory,
        name: newCategory.name,
        color: newCategory.color,
        bgColor: findColorOptionByValue(newCategory.color)?.bg || 'bg-gray-100',
        textColor: findColorOptionByValue(newCategory.color)?.text || 'text-gray-800'
      };
      
      try {
        const { error } = await supabase
          .from('categories')
          .update({
            name: updatedCategory.name,
            color: updatedCategory.color,
            bg_color: updatedCategory.bgColor,
            text_color: updatedCategory.textColor
          })
          .eq('id', editingCategory.id)
          .eq('user_id', user?.id || '');

        if (error) {
          toast({
            title: "Error",
            description: `Failed to update category: ${error.message}`,
            variant: "destructive",
          });
          return;
        }

        const updatedCategories = categories.map(c => 
          c.id === editingCategory.id ? updatedCategory : c
        );
        setCategories(updatedCategories);
        setEditingCategory(null);
        setNewCategory({ name: '', color: '#3B82F6' });
        onCategoryChange?.(updatedCategories);
        
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
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user?.id || '');

      if (error) {
        toast({
          title: "Error",
          description: `Failed to delete category: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      const updatedCategories = categories.filter(c => c.id !== categoryId);
      setCategories(updatedCategories);
      onCategoryChange?.(updatedCategories);
      
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
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">

        
        <div className="space-y-6">
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

          {/* Existing Categories */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium">Current Categories</h3>
              <Popover
                onOpenChange={(open) => {
                  if (open) {
                    setNewCategory({ name: '', color: '#3B82F6' });
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3 w-3 mr-1" /> New Category
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
                      <div className="grid grid-cols-5 gap-2">
                        {colorOptions.map(color => (
                          <button
                            key={color.value}
                            onClick={() => setNewCategory({ ...newCategory, color: color.value })}
                            className={`w-10 h-10 rounded-md border-2 transition-all ${color.bg} ${
                              newCategory.color === color.value ? 'border-gray-400 scale-105' : 'border-transparent hover:border-gray-400'
                            }`}
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
            <div className="grid grid-cols-2 gap-3">
              {categories.map(category => (
                <div key={category.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
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
                        <div className={`w-4 h-4 rounded-sm ${category.bgColor}`} />
                        <Badge className={`${category.bgColor} ${category.textColor} border-0`}>
                          {category.name}
                        </Badge>
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
                          <div className="grid grid-cols-5 gap-2">
                            {colorOptions.map(color => (
                              <button
                                key={color.value}
                                onClick={() => setNewCategory({ ...newCategory, color: color.value })}
                                className={`w-10 h-10 rounded-md border-2  transition-all ${color.bg} ${
                                  newCategory.color === color.value ? 'border-gray-400 scale-105' : 'border-transparent hover:border-gray-400'
                                }`}
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
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
};
