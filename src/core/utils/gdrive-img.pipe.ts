import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'gdriveImg',
  standalone: true,
})
export class GdriveImgPipe implements PipeTransform {
  transform(url: string): string {
    if (!url) return url;

    // Format: /file/d/{id}/view  or  /d/{id}
    const slashMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (slashMatch) {
      return `https://lh3.googleusercontent.com/d/${slashMatch[1]}`;
    }

    // Format: ?id={id}  or  &id={id}
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
    }

    return url;
  }
}
