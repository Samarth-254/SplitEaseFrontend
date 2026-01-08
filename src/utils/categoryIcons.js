import { 
  Coffee, 
  ShoppingCart, 
  Home, 
  Car, 
  Utensils, 
  Film, 
  Plane, 
  Shirt,
  Heart,
  Zap,
  BookOpen,
  DollarSign
} from 'lucide-react';

export const expenseCategories = [
  { value: 'food', label: 'Food & Dining', icon: Utensils, color: 'bg-orange-500/20 text-orange-400' },
  { value: 'groceries', label: 'Groceries', icon: ShoppingCart, color: 'bg-green-500/20 text-green-400' },
  { value: 'transport', label: 'Transport', icon: Car, color: 'bg-blue-500/20 text-blue-400' },
  { value: 'entertainment', label: 'Entertainment', icon: Film, color: 'bg-purple-500/20 text-purple-400' },
  { value: 'utilities', label: 'Utilities', icon: Zap, color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'rent', label: 'Rent', icon: Home, color: 'bg-red-500/20 text-red-400' },
  { value: 'shopping', label: 'Shopping', icon: Shirt, color: 'bg-pink-500/20 text-pink-400' },
  { value: 'travel', label: 'Travel', icon: Plane, color: 'bg-cyan-500/20 text-cyan-400' },
  { value: 'healthcare', label: 'Healthcare', icon: Heart, color: 'bg-rose-500/20 text-rose-400' },
  { value: 'education', label: 'Education', icon: BookOpen, color: 'bg-indigo-500/20 text-indigo-400' },
  { value: 'drinks', label: 'Drinks', icon: Coffee, color: 'bg-amber-500/20 text-amber-400' },
  { value: 'other', label: 'Other', icon: DollarSign, color: 'bg-neutral-500/20 text-neutral-400' },
];

export const getCategoryIcon = (category) => {
  const cat = expenseCategories.find(c => c.value === category?.toLowerCase());
  return cat || expenseCategories[expenseCategories.length - 1]; // Default to 'other'
};
