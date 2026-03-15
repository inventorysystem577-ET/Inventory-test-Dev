export const CATEGORIES = {
  ELECTRONICS: 'Electronics',
  MERCHANDISE: 'Merchandise',
  TOOLS: 'Tools',
  COMPONENTS: 'Components'
};

export const CATEGORY_OPTIONS = [
  { value: CATEGORIES.ELECTRONICS, label: 'Electronics (electronic devices and gadgets)' },
  { value: CATEGORIES.MERCHANDISE, label: 'Merchandise (jackets, T-shirts, etc.)' },
  { value: CATEGORIES.TOOLS, label: 'Tools (equipment and tools)' },
  { value: CATEGORIES.COMPONENTS, label: 'Components (electronic components)' }
];

export const getCategoryColor = (category) => {
  switch (category) {
    case CATEGORIES.ELECTRONICS:
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case CATEGORIES.MERCHANDISE:
      return 'bg-pink-100 text-pink-800 border-pink-200';
    case CATEGORIES.TOOLS:
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case CATEGORIES.COMPONENTS:
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getCategoryIcon = (category) => {
  switch (category) {
    case CATEGORIES.ELECTRONICS:
      return '📱';
    case CATEGORIES.MERCHANDISE:
      return '�';
    case CATEGORIES.TOOLS:
      return '🔧';
    case CATEGORIES.COMPONENTS:
      return '⚡';
    default:
      return '📋';
  }
};
