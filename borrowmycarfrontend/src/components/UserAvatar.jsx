import React from 'react';

const UserAvatar = ({ 
  user, 
  size = 'md', 
  className = '',
  showImage = true 
}) => {
  const getInitials = (name) => {
    if (!name) return 'U';
    
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    
    // Take first letter of first name and first letter of last name
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6 text-xs';
      case 'md':
        return 'w-8 h-8 text-sm';
      case 'lg':
        return 'w-12 h-12 text-base';
      case 'xl':
        return 'w-16 h-16 text-lg';
      default:
        return 'w-8 h-8 text-sm';
    }
  };

  const getBackgroundColor = (name) => {
    if (!name) return 'bg-gray-500';
    
    const colors = [
      'bg-red-500',
      'bg-orange-500', 
      'bg-amber-500',
      'bg-yellow-500',
      'bg-lime-500',
      'bg-green-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-sky-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-violet-500',
      'bg-purple-500',
      'bg-fuchsia-500',
      'bg-pink-500',
      'bg-rose-500'
    ];
    
    // Generate consistent color based on name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const userName = user?.name || user?.username || '';
  const profileImage = user?.profileImage || user?.avatar;

  if (showImage && profileImage) {
    return (
      <img 
        src={profileImage} 
        alt={userName}
        className={`${getSizeClasses()} rounded-full object-cover ${className}`}
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  }

  return (
    <div className={`${getSizeClasses()} ${getBackgroundColor(userName)} rounded-full flex items-center justify-center text-white font-semibold ${className}`}>
      {getInitials(userName)}
    </div>
  );
};

export default UserAvatar;