import React, { useState } from 'react';
import { X, Tag, Trash2, Edit2, Check, XCircle, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Category {
  id: string;
  name: string;
  is_default: boolean;
}

interface CategoryManagementProps {
  showCategoryManagement: boolean;
  setShowCategoryManagement: (show: boolean) => void;
  categories: Category[];
  handleDeleteCategory: (id: string) => void;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({
  showCategoryManagement,
  setShowCategoryManagement,
  categories,
  handleDeleteCategory,
}) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  const handleEditStart = (category: Category) => {
    if (category.is_default) {
      setError('Cannot edit default categories');
      return;
    }
    setEditingCategory(category.id);
    setEditedName(category.name);
    setError(null);
  };

  const handleEditCancel = () => {
    setEditingCategory(null);
    setEditedName('');
    setError(null);
  };

  const handleEditSave = async (categoryId: string) => {
    if (!editedName.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const { data: existingCategory, error: fetchError } = await supabase
        .from('subscription_categories')
        .select('id')
        .eq('name', editedName.trim())
        .neq('id', categoryId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (existingCategory) throw new Error('A category with this name already exists');

      const { error: updateError } = await supabase
        .from('subscription_categories')
        .update({ 
          name: editedName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId)
        .eq('is_default', false)
        .single();

      if (updateError) throw updateError;

      setEditingCategory(null);
      setEditedName('');
      setError(null);
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err instanceof Error ? err.message : 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);
    setCreateSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: existingCategory, error: fetchError } = await supabase
        .from('subscription_categories')
        .select('id')
        .eq('name', newCategoryName.trim())
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (existingCategory) throw new Error('A category with this name already exists');

      const { error: createError } = await supabase
        .from('subscription_categories')
        .insert({
          name: newCategoryName.trim(),
          user_id: user.id,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;

      setCreateSuccess(true);
      setTimeout(() => setCreateSuccess(false), 3000);
      setNewCategoryName('');
      setShowNewCategoryInput(false);
      setError(null);
    } catch (err) {
      console.error('Error creating category:', err);
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      handleCreateCategory();
    }
  };

  if (!showCategoryManagement) return null;

  const sortedCategories = [...categories].sort((a, b) => {
    if (a.name === 'Other') return 1;
    if (b.name === 'Other') return -1;
    if (a.is_default && !b.is_default) return 1;
    if (!a.is_default && b.is_default) return -1;
    return a.name.localeCompare(b.name);
  });

  const userCategories = sortedCategories.filter(category => !category.is_default);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Manage Categories</h3>
          <button
            onClick={() => {
              setShowCategoryManagement(false);
              setEditingCategory(null);
              setEditedName('');
              setError(null);
              setShowNewCategoryInput(false);
              setNewCategoryName('');
            }}
            className="text-gray-400 hover:text-gray-500 p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 p-3 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {createSuccess && (
          <div className="mb-4 bg-green-50 p-3 rounded-md">
            <p className="text-sm text-green-700">Category created successfully!</p>
          </div>
        )}

        <div className="space-y-4">
          {/* New Category Input */}
          {showNewCategoryInput ? (
            <div className="flex items-center space-x-2">
              <div className="flex-grow">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter category name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  autoFocus
                />
              </div>
              <button
                onClick={handleCreateCategory}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  'Add'
                )}
              </button>
              <button
                onClick={() => {
                  setShowNewCategoryInput(false);
                  setNewCategoryName('');
                  setError(null);
                }}
                disabled={loading}
                className="inline-flex items-center p-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewCategoryInput(true)}
              className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Category
            </button>
          )}

          {/* User Categories */}
          {userCategories.length > 0 ? (
            <div className="space-y-2">
              {userCategories.map(category => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg transition-colors duration-200 hover:bg-gray-100"
                >
                  <div className="flex items-center flex-grow mr-2">
                    <Tag className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                    {editingCategory === category.id ? (
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-grow min-w-0 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Category name"
                        autoFocus
                        disabled={loading}
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingCategory === category.id ? (
                      <>
                        <button
                          onClick={() => handleEditSave(category.id)}
                          disabled={loading}
                          className="text-green-600 hover:text-green-700 p-1 rounded-full hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          title="Save"
                        >
                          {loading ? (
                            <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={handleEditCancel}
                          disabled={loading}
                          className="text-gray-600 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          title="Cancel"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditStart(category)}
                          className="text-blue-600 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors duration-200"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors duration-200"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-500 py-4">
              No custom categories yet
            </p>
          )}

          {/* Default Categories */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Default Categories</h4>
            <div className="space-y-2">
              {sortedCategories
                .filter(category => category.is_default)
                .map(category => (
                  <div
                    key={category.id}
                    className="flex items-center p-2 bg-gray-50/50 rounded transition-colors duration-200"
                  >
                    <Tag className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">{category.name}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;