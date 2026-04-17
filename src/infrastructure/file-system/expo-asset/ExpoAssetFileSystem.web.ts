import { Asset } from 'expo-asset';
import type { FileSystem } from '@/infrastructure/file-system/FileSystem';

class ExpoAssetFileSystem implements FileSystem<'expo'> {
  async getAssetAsString(virtualAssetModule: number) {
    const asset = await Asset.fromModule(virtualAssetModule).downloadAsync();
    const response = await fetch(asset.localUri as string);
    return response.text();
  }
}

export { ExpoAssetFileSystem };
