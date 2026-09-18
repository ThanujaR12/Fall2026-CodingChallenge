// Pixabay's color filters, offered for browsing and searching by color (Palette Boards).
export const IMAGE_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'turquoise',
  'blue',
  'lilac',
  'pink',
  'brown',
  'black',
  'gray',
  'white',
  'grayscale',
] as const;

export type ImageColor = (typeof IMAGE_COLORS)[number];
