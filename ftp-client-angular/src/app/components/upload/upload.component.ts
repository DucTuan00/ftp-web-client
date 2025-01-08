import { Component } from '@angular/core';
import { FtpService } from '../../services/ftp.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css'
})
export class UploadComponent {
  selectedFile: File | null = null;
  remotePath: string = '';

  constructor(private ftpService: FtpService) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  upload() {
    if (this.selectedFile) {
      this.ftpService.uploadFile('localhost', 21, 'user', 'password', this.selectedFile)
        .subscribe(
          response => alert('Upload thành công: ' + response),
          error => alert('Lỗi khi upload file: ' + error.message)
        );
    }
  }
}
