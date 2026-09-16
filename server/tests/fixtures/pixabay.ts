// Fake Pixabay hits and a tiny JPEG so tests run without network access or an API key.
import type { PixabayHit } from '../../src/services/pixabayService.js';

function hit(id: number, tags: string, user: string): PixabayHit {
  return {
    id,
    pageURL: `https://pixabay.com/photos/example-${id}/`,
    tags,
    previewURL: `https://cdn.pixabay.com/photo/preview-${id}.jpg`,
    webformatURL: `https://pixabay.com/get/webformat-${id}.jpg`,
    webformatWidth: 640,
    webformatHeight: 427,
    largeImageURL: `https://pixabay.com/get/large-${id}.jpg`,
    user,
  };
}

export const hits: PixabayHit[] = [
  hit(101, 'lighthouse, coast, sea', 'Ines Okonkwo'),
  hit(102, 'fog, harbour, morning', 'L. Marchetti'),
  hit(103, 'cliff, mist, green', 'T. Halvorsen'),
];

// Smallest valid JPEG header bytes; content is irrelevant, only the type and size matter.
export const tinyJpeg = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9,
]);
