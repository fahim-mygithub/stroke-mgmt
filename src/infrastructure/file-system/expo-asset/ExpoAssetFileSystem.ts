import { File } from 'expo-file-system';
import { Asset } from 'expo-asset';
import type { FileSystem } from '@/infrastructure/file-system/FileSystem';

class ExpoAssetFileSystem implements FileSystem<'expo'> {
  async getAssetAsString(virtualAssetModule: number) {
    const asset = await Asset.fromModule(virtualAssetModule).downloadAsync();
    const file = new File(asset.localUri as string);
    return file.text();
  }
}

export { ExpoAssetFileSystem };
