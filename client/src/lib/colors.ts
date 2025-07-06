// Color mapping for The Office characters and participants
export const COLOR_MAPPING = {
  // Character colors
  blue: {
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    text: 'text-blue-800',
    borderLeft: 'border-l-blue-400',
    bgVariant: 'bg-blue-50'
  },
  red: {
    bg: 'bg-red-100',
    border: 'border-red-300',
    text: 'text-red-800',
    borderLeft: 'border-l-red-400',
    bgVariant: 'bg-red-50'
  },
  green: {
    bg: 'bg-green-100',
    border: 'border-green-300',
    text: 'text-green-800',
    borderLeft: 'border-l-green-400',
    bgVariant: 'bg-green-50'
  },
  pink: {
    bg: 'bg-pink-100',
    border: 'border-pink-300',
    text: 'text-pink-800',
    borderLeft: 'border-l-pink-400',
    bgVariant: 'bg-pink-50'
  },
  purple: {
    bg: 'bg-purple-100',
    border: 'border-purple-300',
    text: 'text-purple-800',
    borderLeft: 'border-l-purple-400',
    bgVariant: 'bg-purple-50'
  },
  orange: {
    bg: 'bg-orange-100',
    border: 'border-orange-300',
    text: 'text-orange-800',
    borderLeft: 'border-l-orange-400',
    bgVariant: 'bg-orange-50'
  },
  yellow: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
    text: 'text-yellow-800',
    borderLeft: 'border-l-yellow-400',
    bgVariant: 'bg-yellow-50'
  },
  brown: {
    bg: 'bg-amber-100',
    border: 'border-amber-300',
    text: 'text-amber-800',
    borderLeft: 'border-l-amber-400',
    bgVariant: 'bg-amber-50'
  },
  gray: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-800',
    borderLeft: 'border-l-gray-400',
    bgVariant: 'bg-gray-50'
  }
};

export function getColorClasses(color: string) {
  return COLOR_MAPPING[color as keyof typeof COLOR_MAPPING] || COLOR_MAPPING.gray;
}

export function getParticipantColor(participantName: string, participants: Array<{name: string; color: string}>) {
  const participant = participants.find(p => p.name === participantName);
  return participant?.color || 'gray';
}