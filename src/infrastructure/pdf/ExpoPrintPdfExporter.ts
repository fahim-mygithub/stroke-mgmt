import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import type { PdfExporter } from '@/application/ports/PdfExporter';

/**
 * PdfExporter backed by expo-print (HTML -> PDF) + expo-sharing (share sheet).
 * expo-print writes the PDF to a cache file with a generated name; we rename it
 * to a human-friendly filename before sharing so the handoff has a sensible name.
 */
class ExpoPrintPdfExporter implements PdfExporter {
  static $inject = [];

  async exportHtmlToPdf(html: string, filename: string): Promise<void> {
    const { uri } = await Print.printToFileAsync({ html });

    let shareUri = uri;
    try {
      const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      const src = new File(uri);
      const dest = new File(Paths.cache, safeName);
      if (dest.exists) dest.delete();
      src.copy(dest);
      shareUri = dest.uri;
    } catch {
      // If renaming fails, fall back to sharing the original generated file.
      shareUri = uri;
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(shareUri, {
        mimeType: 'application/pdf',
        dialogTitle: filename,
        UTI: 'com.adobe.pdf',
      });
    }
    // If sharing is unavailable (rare on device), the PDF still exists at shareUri.
  }
}

export { ExpoPrintPdfExporter };
