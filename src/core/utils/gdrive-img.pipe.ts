import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'gdriveImg',
  standalone: true,
})
export class GdriveImgPipe implements PipeTransform {
  transform(url: string): string {
    if (!url) return url;

    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }

    return url;
  }
}
