import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

const NAME_MAP = {
  search: 'search-outline',
  searchFilled: 'search',
  add: 'add',
  close: 'close',
  back: 'chevron-back',
  backIOS: 'chevron-back',
  forward: 'chevron-forward',
  more: 'ellipsis-horizontal',
  check: 'checkmark',
  checkCircle: 'checkmark-circle',
  checkCircleOutline: 'checkmark-circle-outline',
  clock: 'time-outline',
  camera: 'camera-outline',
  cameraFilled: 'camera',
  image: 'image-outline',
  imageFilled: 'image',
  location: 'location-outline',
  locationFilled: 'location',
  bell: 'notifications-outline',
  bellFilled: 'notifications',
  bellOff: 'notifications-off-outline',
  download: 'download-outline',
  share: 'share-outline',
  shareIOS: 'share-outline',
  trash: 'trash-outline',
  filter: 'options-outline',
  filterFilled: 'options',
  settings: 'settings-outline',
  settingsFilled: 'settings',
  sun: 'sunny-outline',
  moon: 'moon-outline',
  phone: 'call-outline',
  email: 'mail-outline',
  message: 'chatbubble-outline',
  doc: 'document-text-outline',
  docFilled: 'document-text',
  list: 'list-outline',
  grid: 'grid-outline',
  shield: 'shield-checkmark-outline',
  info: 'information-circle-outline',
  warning: 'alert-circle-outline',
  sparkle: 'sparkles-outline',
  flashOn: 'flash-outline',
  eye: 'eye-outline',
  eyeOff: 'eye-off-outline',
  link: 'link-outline',
  refresh: 'refresh-outline',
  pencil: 'create-outline',
  flag: 'flag-outline',
  calendar: 'calendar-outline',
  briefcase: 'briefcase-outline',
  archive: 'archive-outline',
  folder: 'folder-outline',
  chevronDown: 'chevron-down',
  chevronUp: 'chevron-up',
  chevronRight: 'chevron-forward',
  play: 'play-outline',
  pause: 'pause-outline',
};

export const ICON_NAMES = Object.keys(NAME_MAP);

export function Icon({
  name,
  size = 20,
  color,
  weight,
  style,
  accessibilityLabel,
  testID,
}) {
  const { colors } = useTheme();
  const resolvedName = NAME_MAP[name] || name;
  const resolvedColor = color || colors.ink;
  return (
    <Ionicons
      name={resolvedName}
      size={size}
      color={resolvedColor}
      style={style}
      accessibilityLabel={accessibilityLabel || name}
      testID={testID}
    />
  );
}

export function getIconName(name) {
  return NAME_MAP[name] || name;
}

export default Icon;
