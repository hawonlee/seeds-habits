import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Palette, LayoutGrid } from 'lucide-react';
import { Category, fetchCategories, getCategories } from '@/lib/categories';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const fetchedCategories = await fetchCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const colorOptions = [
    { name: 'Blue', value: '#3B82F6', bg: 'bg-blue-100', text: 'text-blue-800' },
    { name: 'Green', value: '#10B981', bg: 'bg-green-100', text: 'text-green-800' },
    { name: 'Purple', value: '#8B5CF6', bg: 'bg-purple-100', text: 'text-purple-800' },
    { name: 'Amber', value: '#F59E0B', bg: 'bg-amber-100', text: 'text-amber-800' },
    { name: 'Red', value: '#EF4444', bg: 'bg-red-100', text: 'text-red-800' },
    { name: 'Cyan', value: '#06B6D4', bg: 'bg-cyan-100', text: 'text-cyan-800' },
    { name: 'Lime', value: '#84CC16', bg: 'bg-lime-100', text: 'text-lime-800' },
    { name: 'Pink', value: '#EC4899', bg: 'bg-pink-100', text: 'text-pink-800' },
    { name: 'Indigo', value: '#6366F1', bg: 'bg-indigo-100', text: 'text-indigo-800' },
    { name: 'Orange', value: '#F97316', bg: 'bg-orange-100', text: 'text-orange-800' }
  ];

  const handleAddCategory = async () => {
    if (newCategory.name && newCategory.color) {
      const category: Category = {
        id: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
        name: newCategory.name,
        color: newCategory.color,
        bgColor: colorOptions.find(c => c.value === newCategory.color)?.bg || 'bg-gray-100',
        textColor: colorOptions.find(c => c.value === newCategory.color)?.text || 'text-gray-800'
      };
      
      try {
        const { error } = await supabase
          .from('categories')
          .insert({
            id: category.id,
            name: category.name,
            color: category.color,
            bg_color: category.bgColor,
            text_color: category.textColor
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
        
        toast({
          title: "Success",
          description: "Category added successfully",
        });
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
    setNewCategory({
      name: category.name,
      color: category.color
    });
  };

  const handleUpdateCategory = async () => {
    if (editingCategory && newCategory.name && newCategory.color) {
      const updatedCategory: Category = {
        ...editingCategory,
        name: newCategory.name,
        color: newCategory.color,
        bgColor: colorOptions.find(c => c.value === newCategory.color)?.bg || 'bg-gray-100',
        textColor: colorOptions.find(c => c.value === newCategory.color)?.text || 'text-gray-800'
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
          .eq('id', editingCategory.id);

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
        
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
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
        .eq('id', categoryId);

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
      
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
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
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Global Adoption Threshold */}
          <div className="p-3 border rounded-lg">
            <h3 className="text-lg font-medium mb-2">Adoption Threshold</h3>
            <p className="text-sm text-muted-foreground mb-3">Number of days a habit must be completed to become adopted.</p>
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
            <h3 className="text-lg font-medium mb-4">Current Categories</h3>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(category => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <Badge
                      className={`${category.bgColor} ${category.textColor} border-0`}
                    >
                      {category.name}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add/Edit Category Form */}
          <div>
            <h3 className="text-lg font-medium mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Category Name</label>
                <Input
                  placeholder="Enter category name"
                  value={newCategory.name || ''}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setNewCategory({ ...newCategory, color: color.value })}
                      className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${
                        newCategory.color === color.value
                          ? 'border-gray-900 scale-110'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.value }}
                    >
                      {newCategory.color === color.value && (
                        <div className="w-3 h-3 bg-white rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                  disabled={!newCategory.name || !newCategory.color}
                >
                  {/* <Plus className="h-4 w-4 mr-2" /> */}
                  {editingCategory ? 'Update' : 'Add'} Category
                </Button>
                {editingCategory && (
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
