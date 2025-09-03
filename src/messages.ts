
import {notFound} from 'next/navigation';
 
// A list of all locales that are supported
export const locales = ['en', 'te'];
 
export async function getMessages(locale: string) {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();
 
  return (await import(`./messages/${locale}.json`)).default;
}
