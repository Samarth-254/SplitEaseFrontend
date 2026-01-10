import { 
  Utensils, Car, Hotel, Film, ShoppingBag, Zap, Home, Heart,
  Coffee, Plane, Train, Bus, Pizza, Beer, Gift, Book, Phone, Wifi,
  DollarSign, Briefcase, Dumbbell, Scissors, Baby, Gamepad2,
  Shirt, PiggyBank, TrendingUp, Wrench, GraduationCap, MapPin, Shield, Trophy
} from 'lucide-react';

// Map AI-generated category names to icon config
const categoryMap = {
  // AI Category Names (exact match from backend)
  'Food & Dining': {
    icon: Utensils,
    color: 'bg-orange-500/20 text-orange-400'
  },
  'Transportation': {
    icon: Car,
    color: 'bg-blue-500/20 text-blue-400'
  },
  'Travel': {
    icon: Plane,
    color: 'bg-sky-500/20 text-sky-400'
  },
  'Accommodation': {
    icon: Hotel,
    color: 'bg-indigo-500/20 text-indigo-400'
  },
  'Tourism & Attractions': {
    icon: MapPin,
    color: 'bg-amber-600/20 text-amber-500'
  },
  'Entertainment & Recreation': {
    icon: Film,
    color: 'bg-purple-500/20 text-purple-400'
  },
  'Shopping & Retail': {
    icon: ShoppingBag,
    color: 'bg-pink-500/20 text-pink-400'
  },
  'Groceries & Household': {
    icon: ShoppingBag,
    color: 'bg-green-500/20 text-green-400'
  },
  'Utilities & Bills': {
    icon: Zap,
    color: 'bg-yellow-500/20 text-yellow-400'
  },
  'Rent & Housing': {
    icon: Home,
    color: 'bg-indigo-500/20 text-indigo-400'
  },
  'Healthcare & Medical': {
    icon: Heart,
    color: 'bg-red-500/20 text-red-400'
  },
  'Education & Learning': {
    icon: GraduationCap,
    color: 'bg-teal-500/20 text-teal-400'
  },
  'Gifts & Donations': {
    icon: Gift,
    color: 'bg-rose-500/20 text-rose-400'
  },
  'Sports': {
    icon: Trophy,
    color: 'bg-green-600/20 text-green-500'
  },
  'Fitness': {
    icon: Dumbbell,
    color: 'bg-orange-600/20 text-orange-500'
  },
  'Personal Care & Beauty': {
    icon: Scissors,
    color: 'bg-pink-600/20 text-pink-500'
  },
  'Childcare & Baby': {
    icon: Baby,
    color: 'bg-blue-300/20 text-blue-300'
  },
  'Gaming & Hobbies': {
    icon: Gamepad2,
    color: 'bg-purple-600/20 text-purple-500'
  },
  'Clothing & Accessories': {
    icon: Shirt,
    color: 'bg-fuchsia-500/20 text-fuchsia-400'
  },
  'Insurance': {
    icon: Shield,
    color: 'bg-cyan-500/20 text-cyan-400'
  },
  'Investments & Savings': {
    icon: TrendingUp,
    color: 'bg-emerald-500/20 text-emerald-400'
  },
  'Home Improvement & Repairs': {
    icon: Wrench,
    color: 'bg-orange-600/20 text-orange-500'
  },
  'Professional Services': {
    icon: Briefcase,
    color: 'bg-slate-500/20 text-slate-400'
  },
  'Telecommunications': {
    icon: Phone,
    color: 'bg-violet-500/20 text-violet-400'
  },
  'Subscriptions & Memberships': {
    icon: Wifi,
    color: 'bg-indigo-600/20 text-indigo-500'
  },
  'Pet Care': {
    icon: Heart,
    color: 'bg-amber-600/20 text-amber-500'
  },
  'Alcohol & Bars': {
    icon: Beer,
    color: 'bg-amber-500/20 text-amber-400'
  },
  'Coffee & Cafes': {
    icon: Coffee,
    color: 'bg-orange-700/20 text-orange-600'
  },
  
  // Legacy category names (for backward compatibility)
  'food': {
    icon: Utensils,
    color: 'bg-orange-500/20 text-orange-400'
  },
  'drinks': {
    icon: Beer,
    color: 'bg-amber-500/20 text-amber-400'
  },
  'transport': {
    icon: Car,
    color: 'bg-blue-500/20 text-blue-400'
  },
  'travel': {
    icon: Plane,
    color: 'bg-sky-500/20 text-sky-400'
  },
  'accommodation': {
    icon: Hotel,
    color: 'bg-indigo-500/20 text-indigo-400'
  },
  'entertainment': {
    icon: Film,
    color: 'bg-purple-500/20 text-purple-400'
  },
  'shopping': {
    icon: ShoppingBag,
    color: 'bg-pink-500/20 text-pink-400'
  },
  'groceries': {
    icon: ShoppingBag,
    color: 'bg-green-500/20 text-green-400'
  },
  'utilities': {
    icon: Zap,
    color: 'bg-yellow-500/20 text-yellow-400'
  },
  'rent': {
    icon: Home,
    color: 'bg-indigo-500/20 text-indigo-400'
  },
  'healthcare': {
    icon: Heart,
    color: 'bg-red-500/20 text-red-400'
  },
  'education': {
    icon: GraduationCap,
    color: 'bg-teal-500/20 text-teal-400'
  },
  'gifts': {
    icon: Gift,
    color: 'bg-rose-500/20 text-rose-400'
  },
  'other': {
    icon: DollarSign,
    color: 'bg-neutral-500/20 text-neutral-400'
  }
};

export const getCategoryIcon = (category) => {
  if (!category) {
    return {
      icon: DollarSign,
      color: 'bg-neutral-500/20 text-neutral-400',
      label: 'Other'
    };
  }
  
  const categoryData = categoryMap[category] || categoryMap['other'];
  return {
    icon: categoryData.icon,
    color: categoryData.color,
    label: category
  };
};
