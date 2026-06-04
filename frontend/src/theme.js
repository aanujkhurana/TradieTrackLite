export const colors = {
  ink: '#151411',
  text: '#292722',
  muted: '#69655B',
  subtle: '#918B80',
  background: '#F3F0EA',
  canvas: '#E9E4D9',
  surface: '#FFFCF6',
  surfaceAlt: '#F8F5EE',
  surfaceRaised: '#FFFDF8',
  surfaceInset: '#ECE6DA',
  border: '#D9D1C2',
  borderSoft: '#E7DFD2',
  borderStrong: '#B8AD9B',
  overlay: 'rgba(21, 20, 17, 0.78)',
  white: '#FFFFFF',
  accent: '#2F6C5F',
  accentInk: '#153C35',
  accentSoft: '#E5F0EC',
  accentBorder: '#AFCFC5',
  amber: '#B97912',
  amberSoft: '#F4EBDD',
  amberBorder: '#E0C090',
  danger: '#8E332A',
  dangerSoft: '#F3E5E1',
  success: '#3F7355',
  successSoft: '#E5EFE8',
  graphite: '#27241F',
};

export const typography = {
  eyebrow: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
    letterSpacing: 0,
  },
  screenTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: 0,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: 0,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
  },
  small: {
    fontSize: 13,
    lineHeight: 19,
  },
  label: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  screen: 20,
  card: 18,
  gap: 12,
  section: 18,
};

export const radii = {
  xs: 4,
  sm: 6,
  md: 8,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 1,
  },
  lift: {
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 2,
  },
};

export const buttons = {
  minHeight: 50,
  radius: radii.md,
};

export const motion = {
  pressedOpacity: 0.72,
};
