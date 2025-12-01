// src/components/ProfileAvatar.js

import React from 'react';

const ProfileAvatar = ({ name, size = 'md', className = '' }) => {
  // Get first letter of name, fallback to 'U' if no name
  const initial = name ? name.charAt(0).toUpperCase() : 'U';
  
  // Size variants
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg',
    '2xl': 'w-16 h-16 text-2xl'
  };

  // Generate a consistent color based on the name
  const getColorFromName = (name) => {
    if (!name) return 'from-gray-500 to-gray-600';
    
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-red-500 to-red-600',
      'from-orange-500 to-orange-600',
      'from-yellow-500 to-yellow-600',
      'from-green-500 to-green-600',
      'from-teal-500 to-teal-600',
      'from-cyan-500 to-cyan-600',
      'from-indigo-500 to-indigo-600',
    ];
    
    // Use first character code to pick a color
    const charCode = name.charCodeAt(0);
    const colorIndex = charCode % colors.length;
    return colors[colorIndex];
  };

  const gradientColor = getColorFromName(name);

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        rounded-full 
        bg-gradient-to-br ${gradientColor}
        flex items-center justify-center
        font-bold text-white
        shadow-lg
        ${className}
      `}
    >
      {initial}
    </div>
  );
};

export default ProfileAvatar;
