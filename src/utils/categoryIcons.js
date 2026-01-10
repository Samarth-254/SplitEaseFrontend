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
  DollarSign,
  Beer,
  Dumbbell,
  Trophy,
  Gift,
  Shield,
  PawPrint,
  Wrench,
  Briefcase,
  CreditCard
} from 'lucide-react';

export const expenseCategories = [
  { value: 'Food & Dining', label: 'Food & Dining', icon: Utensils, color: 'bg-orange-500/20 text-orange-400' },
  { value: 'Drinks & Beverages', label: 'Drinks & Beverages', icon: Beer, color: 'bg-amber-500/20 text-amber-400' },
  { value: 'Groceries', label: 'Groceries', icon: ShoppingCart, color: 'bg-green-500/20 text-green-400' },
  { value: 'Transportation', label: 'Transportation', icon: Car, color: 'bg-blue-500/20 text-blue-400' },
  { value: 'Entertainment', label: 'Entertainment', icon: Film, color: 'bg-purple-500/20 text-purple-400' },
  { value: 'Shopping', label: 'Shopping', icon: Shirt, color: 'bg-pink-500/20 text-pink-400' },
  { value: 'Health & Fitness', label: 'Health & Fitness', icon: Heart, color: 'bg-rose-500/20 text-rose-400' },
  { value: 'Sports & Recreation', label: 'Sports & Recreation', icon: Trophy, color: 'bg-emerald-500/20 text-emerald-400' },
  { value: 'Travel', label: 'Travel', icon: Plane, color: 'bg-cyan-500/20 text-cyan-400' },
  { value: 'Utilities', label: 'Utilities', icon: Zap, color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'Rent & Housing', label: 'Rent & Housing', icon: Home, color: 'bg-red-500/20 text-red-400' },
  { value: 'Education', label: 'Education', icon: BookOpen, color: 'bg-indigo-500/20 text-indigo-400' },
  { value: 'Personal Care', label: 'Personal Care', icon: Dumbbell, color: 'bg-violet-500/20 text-violet-400' },
  { value: 'Gifts & Donations', label: 'Gifts & Donations', icon: Gift, color: 'bg-fuchsia-500/20 text-fuchsia-400' },
  { value: 'Insurance', label: 'Insurance', icon: Shield, color: 'bg-slate-500/20 text-slate-400' },
  { value: 'Pets', label: 'Pets', icon: PawPrint, color: 'bg-lime-500/20 text-lime-400' },
  { value: 'Home Improvement', label: 'Home Improvement', icon: Wrench, color: 'bg-teal-500/20 text-teal-400' },
  { value: 'Office Supplies', label: 'Office Supplies', icon: Briefcase, color: 'bg-sky-500/20 text-sky-400' },
  { value: 'Subscriptions', label: 'Subscriptions', icon: CreditCard, color: 'bg-orange-500/20 text-orange-400' },
  { value: 'Other', label: 'Other', icon: DollarSign, color: 'bg-neutral-500/20 text-neutral-400' },
];

export const getCategoryIcon = (category) => {
  if (!category) return expenseCategories[expenseCategories.length - 1];
  
  // Try exact match first
  let cat = expenseCategories.find(c => c.value === category);
  
  // Try case-insensitive match
  if (!cat) {
    cat = expenseCategories.find(c => c.value.toLowerCase() === category.toLowerCase());
  }
  
  // Try partial match
  if (!cat) {
    cat = expenseCategories.find(c => 
      c.value.toLowerCase().includes(category.toLowerCase()) ||
      category.toLowerCase().includes(c.value.toLowerCase())
    );
  }
  
  return cat || expenseCategories[expenseCategories.length - 1]; // Default to 'other'
};
