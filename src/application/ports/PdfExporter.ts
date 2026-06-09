// Application port: turn an HTML document into a PDF and hand it to the user
// (share sheet / save). Implemented by an infrastructure adapter so the view +
// application layers stay free of Expo specifics.
export interface PdfExporter {
  exportHtmlToPdf(html: string, filename: string): Promise<void>;
}
