const Bytez = require('bytez.js');

// Comprehensive category definitions
const EXPENSE_CATEGORIES = {
  'Food & Dining': ['restaurant', 'cafe', 'coffee', 'food', 'dining', 'lunch', 'dinner', 'breakfast', 'meal', 'pizza', 'burger', 'sandwich', 'sushi', 'chinese', 'italian', 'mexican', 'indian', 'thai', 'bakery', 'snack', 'fast food', 'mcdonald', 'kfc', 'subway', 'dominos', 'pizza hut', 'starbucks', 'dunkin', 'cafe ama', 'biryani', 'dosa', 'idli', 'paratha', 'haldiram', 'bikanervala', 'thali', 'buffet'],
  'Alcohol & Bars': ['bar', 'pub', 'beer', 'wine', 'cocktail', 'drink', 'alcohol', 'liquor', 'vodka', 'whiskey', 'rum', 'beverage', 'brewery', 'nightclub'],
  'Coffee & Cafes': ['coffee shop', 'cafe', 'starbucks', 'cafe coffee day', 'barista', 'blue tokai', 'espresso', 'latte', 'cappuccino'],
  'Groceries & Household': ['grocery', 'supermarket', 'market', 'vegetables', 'fruits', 'meat', 'dairy', 'milk', 'bread', 'eggs', 'walmart', 'target', 'costco', 'whole foods', 'trader joe', 'safeway', 'kroger', 'blinkit', 'zepto', 'instamart', 'bigbasket'],
  'Transportation': ['uber', 'lyft', 'taxi', 'cab', 'bus', 'train', 'metro', 'subway', 'transit', 'gas', 'fuel', 'petrol', 'diesel', 'parking', 'toll', 'ola', 'auto', 'rickshaw', 'shuttle', 'airport shuttle', 'rapido', 'car rental', 'vehicle'],
  'Travel': ['flight', 'airline', 'airport', 'flight ticket', 'train ticket', 'bus booking', 'vacation', 'trip', 'tour', 'travel package', 'travel agent', 'visa', 'passport'],
  'Accommodation': ['hotel', 'airbnb', 'resort', 'booking', 'expedia', 'oyo', 'accommodation', 'hostel', 'motel', 'lodge', 'hilton', 'marriott', 'hyatt', 'taj hotel', 'room booking', 'hotel stay'],
  'Tourism & Attractions': ['taj mahal', 'red fort', 'monument', 'museum', 'fort', 'palace', 'temple', 'church', 'mosque', 'historical site', 'tourist spot', 'attraction', 'zoo', 'aquarium', 'national park', 'beach', 'waterfall', 'eiffel tower', 'statue', 'gateway of india', 'qutub minar', 'lotus temple', 'india gate', 'entry ticket', 'entry fee', 'sightseeing', 'guided tour'],
  'Entertainment & Recreation': ['movie', 'cinema', 'theater', 'theatre', 'concert', 'show', 'netflix', 'spotify', 'hulu', 'disney', 'amazon prime', 'apple tv', 'youtube premium', 'gaming', 'playstation', 'xbox', 'steam', 'entertainment', 'hotstar', 'amusement park', 'fun', 'recreation', 'bowling', 'arcade'],
  'Shopping & Retail': ['shopping', 'amazon', 'ebay', 'walmart', 'target', 'mall', 'store', 'clothes', 'clothing', 'fashion', 'shoes', 'accessories', 'electronics', 'gadgets', 'flipkart', 'myntra', 'ajio', 'retail'],
  'Healthcare & Medical': ['doctor', 'hospital', 'clinic', 'pharmacy', 'medicine', 'medical', 'health', 'wellness', 'dentist', 'therapy', 'healthcare', 'surgery', 'consultation', 'blood test', 'xray'],
  'Sports': ['sports', 'golf', 'tennis', 'swimming', 'basketball', 'football', 'soccer', 'baseball', 'cricket', 'sport equipment', 'outdoor', 'hiking', 'camping', 'running', 'athletic', 'badminton', 'volleyball', 'table tennis'],
  'Fitness': ['gym', 'fitness', 'workout', 'yoga', 'pilates', 'crossfit', 'spa', 'massage', 'fitness center', 'personal trainer', 'zumba', 'aerobics'],
  'Travel & Accommodation': ['hotel', 'airbnb', 'resort', 'booking', 'expedia', 'oyo', 'accommodation', 'hostel', 'motel', 'lodge', 'flight', 'airline', 'flight ticket', 'train ticket', 'bus booking'],
  'Utilities & Bills': ['electricity', 'water', 'gas', 'internet', 'phone', 'mobile', 'cable', 'utility', 'wifi', 'broadband', 'bill'],
  'Rent & Housing': ['rent', 'mortgage', 'apartment', 'housing', 'lease', 'property', 'pg', 'hostel'],
  'Education & Learning': ['school', 'college', 'university', 'tuition', 'course', 'class', 'book', 'textbook', 'education', 'learning', 'udemy', 'coursera'],
  'Personal Care & Beauty': ['salon', 'haircut', 'barber', 'beauty', 'cosmetics', 'skincare', 'personal care', 'grooming'],
  'Gifts & Donations': ['gift', 'present', 'donation', 'charity', 'flowers', 'card'],
  'Insurance': ['insurance', 'policy', 'premium', 'coverage'],
  'Pet Care': ['pet', 'vet', 'veterinary', 'dog', 'cat', 'pet food', 'pet care'],
  'Home Improvement & Repairs': ['hardware', 'furniture', 'decor', 'renovation', 'repair', 'home improvement', 'ikea'],
  'Professional Services': ['office', 'stationery', 'supplies', 'printer', 'paper', 'pen', 'professional', 'services'],
  'Subscriptions & Memberships': ['subscription', 'membership', 'monthly fee', 'annual fee'],
  'Other': ['miscellaneous', 'other', 'general']
};

class AICategoryService {
  constructor() {
    this.sdk = null;
    this.model = null;
    this.initializeSDK();
  }

  initializeSDK() {
    const apiKey = process.env.BYTEZ_API_KEY;
    if (!apiKey) {
      console.warn('BYTEZ_API_KEY not found in environment variables. AI category detection will be disabled.');
      return;
    }

    try {
      this.sdk = new Bytez(apiKey);
      this.model = this.sdk.model("openai/gpt-3.5-turbo-1106");
      console.log('✅ AI Category Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AI Category Service:', error);
    }
  }

  /**
   * Detect category using AI
   * @param {string} description - The expense description
   * @returns {Promise<string>} - The detected category
   */
  async detectCategory(description) {
    console.log(`\n🔍 AI Category Detection Started`);
    console.log(`📝 Input Description: "${description}"`);
    
    // Fallback to keyword-based detection if AI is not available
    if (!this.model) {
      console.log(`⚠️  AI model not available, using fallback detection`);
      const fallbackCategory = this.fallbackCategoryDetection(description);
      console.log(`🏷️  Final Category (Fallback): "${fallbackCategory}"`);
      return fallbackCategory;
    }

    try {
      const categoryList = Object.keys(EXPENSE_CATEGORIES).join(', ');
      
      const prompt = `You are a highly intelligent expense categorization AI. Analyze the expense description and return ONLY the most accurate category name from this list: ${categoryList}.

CRITICAL RULES:
1. Return ONLY the exact category name, nothing else (no explanations, no punctuation)
2. Be contextually smart - understand the PURPOSE of the expense

SMART CATEGORIZATION EXAMPLES:
- Restaurants (Cafe Ama, McDonald's, Pizza Hut, Dominos, any restaurant name) → "Food & Dining"
- Monuments/Tourist Places (Taj Mahal, Red Fort, Eiffel Tower, museums, entry tickets) → "Tourism & Attractions"
- Transport (Uber, Ola, taxi, shuttle, auto, metro, bus, petrol) → "Transportation"
- Flights/Train tickets/Travel bookings → "Travel"
- Hotels/Stays (Hilton, OYO, Airbnb, hotel booking) → "Accommodation"
- Movies/Shows/Streaming → "Entertainment & Recreation"
- Sports activities/Equipment → "Sports"
- Gym/Yoga/Workout/Spa → "Fitness"
- Malls/Online shopping/Clothes → "Shopping & Retail"
- Doctors/Medicine/Hospital → "Healthcare & Medical"
- Supermarket/Vegetables/Milk → "Groceries & Household"

KEY DISTINCTIONS:
- Taj Mahal/Red Fort = Monument visit → "Tourism & Attractions" (NOT Travel or Accommodation)
- Hilton/OYO/Hotel = Staying → "Accommodation" (NOT Travel or Tourism)
- Flight/Train ticket = Journey → "Travel" (NOT Transportation or Accommodation)
- Shuttle/Taxi = Local transport → "Transportation" (NOT Travel)
- Cafe = Food & Dining (NOT Coffee & Cafes unless specifically a coffee shop)

Expense description: "${description}"

Category:`;

      console.log(`🤖 Sending prompt to AI model...`);
      
      const { error, output } = await this.model.run([
        {
          role: "user",
          content: prompt
        }
      ], {
        max_completion_tokens: 50,
        temperature: 0.3
      });

      if (error) {
        console.error(`❌ AI Category Detection Error:`, error);
        console.log(`🔄 Falling back to keyword detection`);
        const fallbackCategory = this.fallbackCategoryDetection(description);
        console.log(`🏷️  Final Category (Fallback): "${fallbackCategory}"`);
        return fallbackCategory;
      }

      // Extract the category from the response
      let detectedCategory = '';
      if (typeof output === 'string') {
        detectedCategory = output.trim();
      } else if (output && typeof output === 'object') {
        detectedCategory = (output.message || output.content || output.text || output.response || '').trim();
      }
      
      console.log(`📤 Raw AI Response: "${detectedCategory}"`);

      if (!detectedCategory) {
        console.log(`⚠️  Empty AI response, using fallback detection`);
        const fallbackCategory = this.fallbackCategoryDetection(description);
        console.log(`🏷️  Final Category (Fallback): "${fallbackCategory}"`);
        return fallbackCategory;
      }
      
      // Validate that the detected category is in our list
      const validCategories = Object.keys(EXPENSE_CATEGORIES);
      const matchedCategory = validCategories.find(cat => 
        cat.toLowerCase() === detectedCategory.toLowerCase()
      );

      console.log(`✅ AI Detected: "${detectedCategory}" → Matched: "${matchedCategory || 'INVALID'}"`);

      if (matchedCategory) {
        console.log(`🎉 Final Category (AI): "${matchedCategory}"`);
        console.log(`─────────────────────────────────────────\n`);
        return matchedCategory;
      }

      // If AI returned invalid category, use fallback
      console.log(`⚠️  AI category not valid, using fallback detection`);
      const fallbackCategory = this.fallbackCategoryDetection(description);
      console.log(`🏷️  Final Category (Fallback): "${fallbackCategory}"`);
      console.log(`─────────────────────────────────────────\n`);
      return fallbackCategory;

    } catch (error) {
      console.error(`💥 Unexpected error in AI category detection:`, error);
      console.log(`🔄 Falling back to keyword detection`);
      const fallbackCategory = this.fallbackCategoryDetection(description);
      console.log(`🏷️  Final Category (Fallback): "${fallbackCategory}"`);
      console.log(`─────────────────────────────────────────\n`);
      return fallbackCategory;
    }
  }

  /**
   * Fallback keyword-based category detection
   * @param {string} description - The expense description
   * @returns {string} - The detected category
   */
  fallbackCategoryDetection(description) {
    console.log(`🔍 Running fallback keyword detection for: "${description}"`);
    
    if (!description) {
      console.log(`⚠️  Empty description → "Other"`);
      return 'Other';
    }

    const lowerDesc = description.toLowerCase();
    
    // Check each category's keywords
    for (const [category, keywords] of Object.entries(EXPENSE_CATEGORIES)) {
      for (const keyword of keywords) {
        if (lowerDesc.includes(keyword.toLowerCase())) {
          console.log(`✅ Keyword match: "${keyword}" → "${category}"`);
          return category;
        }
      }
    }

    console.log(`❌ No keyword matches → "Other"`);
    return 'Other';
  }

  /**
   * Get all available categories
   * @returns {Array<string>} - List of all categories
   */
  getAvailableCategories() {
    return Object.keys(EXPENSE_CATEGORIES);
  }
}

// Export singleton instance
module.exports = new AICategoryService();
