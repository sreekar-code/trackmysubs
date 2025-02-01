const categoryColors: { [key: string]: string } = {
  default: '#94A3B8', // slate-400
  entertainment: '#F87171', // red-400
  utilities: '#60A5FA', // blue-400
  shopping: '#34D399', // emerald-400
  food: '#FBBF24', // amber-400
  health: '#A78BFA', // violet-400
  transport: '#F472B6', // pink-400
  housing: '#2DD4BF', // teal-400
  education: '#FB923C', // orange-400
  other: '#94A3B8', // slate-400
};

export const getCategoryColor = (categoryId: string | null): string => {
  if (!categoryId) return categoryColors.default;
  return categoryColors[categoryId] || categoryColors.default;
}; 