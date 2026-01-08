import { 
  Utensils, Car, Hotel, Film, ShoppingBag, Zap, Home, Heart,
  Coffee, Plane, Train, Bus, Pizza, Beer, Gift, Book, Phone, Wifi,
  DollarSign, Briefcase
} from 'lucide-react';

const categoryMap = {
  food: {
    keywords: ['chai', 'tea', 'coffee', 'breakfast', 'lunch', 'dinner', 'snack', 'food', 'eat', 'restaurant', 'pizza', 'burger', 'sandwich', 'biryani', 'rice', 'roti', 'paratha', 'dosa', 'idli', 'vada', 'samosa', 'pakora', 'sweet', 'dessert', 'ice cream', 'cake', 'pastry'],
    icon: Utensils,
    color: 'bg-orange-500/20 text-orange-400'
  },
  drinks: {
    keywords: ['beer', 'wine', 'vodka', 'whiskey', 'rum', 'drink', 'cocktail', 'juice', 'shake', 'smoothie', 'lassi', 'soda', 'cola', 'pepsi', 'sprite', 'alcohol', 'bar', 'pub'],
    icon: Beer,
    color: 'bg-amber-500/20 text-amber-400'
  },
  transport: {
    keywords: ['uber', 'ola', 'taxi', 'cab', 'auto', 'rickshaw', 'bus', 'metro', 'train', 'transport', 'fare', 'ride', 'petrol', 'diesel', 'fuel', 'gas', 'parking'],
    icon: Car,
    color: 'bg-blue-500/20 text-blue-400'
  },
  travel: {
    keywords: ['flight', 'plane', 'airport', 'ticket', 'hotel', 'booking', 'resort', 'vacation', 'trip', 'tour', 'travel', 'airbnb', 'oyo'],
    icon: Plane,
    color: 'bg-sky-500/20 text-sky-400'
  },
  entertainment: {
    keywords: ['movie', 'cinema', 'film', 'show', 'concert', 'game', 'entertainment', 'netflix', 'amazon prime', 'hotstar', 'spotify', 'youtube', 'subscription'],
    icon: Film,
    color: 'bg-purple-500/20 text-purple-400'
  },
  shopping: {
    keywords: ['shopping', 'clothes', 'shirt', 'pant', 'shoes', 'dress', 'amazon', 'flipkart', 'myntra', 'purchase', 'buy', 'mall', 'store', 'shop'],
    icon: ShoppingBag,
    color: 'bg-pink-500/20 text-pink-400'
  },
  groceries: {
    keywords: ['grocery', 'groceries', 'vegetables', 'fruits', 'milk', 'bread', 'eggs', 'sabzi', 'supermarket', 'blinkit', 'zepto', 'instamart', 'swiggy instamart', 'bigbasket'],
    icon: ShoppingBag,
    color: 'bg-green-500/20 text-green-400'
  },
  utilities: {
    keywords: ['electricity', 'water', 'gas', 'bill', 'utility', 'internet', 'wifi', 'broadband', 'mobile', 'recharge', 'phone', 'postpaid'],
    icon: Zap,
    color: 'bg-yellow-500/20 text-yellow-400'
  },
  rent: {
    keywords: ['rent', 'house', 'flat', 'apartment', 'housing', 'lease', 'pg', 'hostel'],
    icon: Home,
    color: 'bg-indigo-500/20 text-indigo-400'
  },
  healthcare: {
    keywords: ['doctor', 'hospital', 'medicine', 'pharmacy', 'medical', 'health', 'clinic', 'dentist', 'checkup', 'test', 'lab'],
    icon: Heart,
    color: 'bg-red-500/20 text-red-400'
  },
  education: {
    keywords: ['book', 'books', 'course', 'class', 'tuition', 'education', 'study', 'school', 'college', 'university', 'fees', 'library'],
    icon: Book,
    color: 'bg-teal-500/20 text-teal-400'
  },
  gifts: {
    keywords: ['gift', 'present', 'birthday', 'anniversary', 'celebration', 'party'],
    icon: Gift,
    color: 'bg-rose-500/20 text-rose-400'
  },
  other: {
    keywords: [],
    icon: DollarSign,
    color: 'bg-neutral-500/20 text-neutral-400'
  }
};

export const detectCategory = (description) => {
  if (!description) return 'other';
  
  const lowerDesc = description.toLowerCase();
  
  for (const [category, { keywords }] of Object.entries(categoryMap)) {
    if (category === 'other') continue;
    
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'other';
};

export const getCategoryData = (category) => {
  return categoryMap[category] || categoryMap.other;
};

export const getCategoryIcon = (category) => {
  const categoryData = getCategoryData(category);
  return {
    icon: categoryData.icon,
    color: categoryData.color,
    label: category
  };
};
