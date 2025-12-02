import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { getScriptPaths } from './common/path.ts';
import { collectData } from './collect-data.ts';

(async () => {
  let start = performance.now();

  let {pathToRoot, pathToDataAsset} = getScriptPaths();
  let assetPath = join(pathToRoot, 'factorio-icons');
  let iconDestinationPath = join(pathToRoot, 'asset', 'icons');

  if (!existsSync(iconDestinationPath)) {
    mkdirSync(iconDestinationPath);
  }

  let items = await collectData({withIconPaths: true});

  for (let item of items) {
    let iconPath = item.icon.split('/').slice(3).join('/');
    await createWebpIcon(
      join(assetPath, iconPath),
      join(iconDestinationPath, `${item.name}.webp`));
  }

  let end = performance.now();
  let time = ((end - start)/1e3).toFixed(2);
  console.log(`Converted ${items.length} images to webp format in ${time}s`);
})();

async function createWebpIcon(origin: string, destination: string) {
  await sharp(readFileSync(origin))
    .resize({width: 64, height: 64, position: 'left'})
    .webp({preset: 'icon'})
    .toFile(destination);
}

// image sprites? 17x17 sprite can handle all current 283 items

// let baseImage = sharp({
//   create: {
//     width: 64 * 2,
//     height: 64 * 2,
//     channels: 4,
//     background: {r: 0, g: 0, b: 0, alpha: 0}
//   }
// });
// let file1 = readFileSync(
//   join(assetPath, 'piercing-rounds-magazine.png')
// );
// let image1 = await sharp(file1)
//   .resize({width: 64, height: 64, position: 'left'});
//
// let file2 = readFileSync(
//   join(assetPath, 'pentapod-egg.png')
// );
// let image2 = await sharp(file2)
//   .resize({width: 64, height: 64, position: 'left'});
//
//
// await baseImage
//   .composite([
//     {input: await image1.toBuffer()},
//     {input: await image2.toBuffer()},
//   ])
//   .webp({preset: 'icon'})
//   .toFile(
//     join(assetPath, 'test.webp'));
