import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const SubscriptionModal: React.FC = () => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setModalError('Category name cannot be empty');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('subscription_categories')
        .insert([{
          name: newCategoryName.trim(),
          user_id: user.id,
          is_default: false
        }])
        .select()
        .single();

      if (error) throw error;

      setSubscriptionForm(prev => ({ ...prev, category_id: data.id }));
      setNewCategoryName('');
      setShowNewCategoryInput(false);
      setModalError(null);
    } catch (err) {
      console.error('Error creating category:', err);
      setModalError(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default SubscriptionModal; 