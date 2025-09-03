
export {};

declare global {
  interface Window {
    gtag?: (
      event: 'config' | 'event',
      trackingId: string,
      config?: {
        page_path?: string;
        event_category?: string;
        event_label?: string;
        value?: number;
      }
    ) => void;
  }
}
