import { Component } from '@angular/core';
import { FtpService } from '../../services/ftp.service';

@Component({
  selector: 'app-file-list',
  templateUrl: './file-list.component.html',
  styleUrl: './file-list.component.css'
})
export class FileListComponent {
  // server: string = '';
  // port: number = 21;
  // user: string = '';
  // password: string = '';
  // files: string[] = [];

  // constructor(private ftpService: FtpService) {}

  // fetchFiles() {
  //   this.ftpService.listFiles(this.server, this.port, this.user, this.password).subscribe(
  //     data => this.files = data,
  //     error => alert('Lỗi khi lấy danh sách file: ' + error.message)
  //   );
  // }

  server: string = '';
  port: number = 21;
  user: string = '';
  password: string = '';
  connected: boolean = false;
  files: { name: string, isFolder: boolean }[] = [];
  selectedFile!: File;
  selectedFiles: string[] = [];
  currentPath: string = '/Share';

  constructor(private ftpService: FtpService) {}

  // Xử lý kết nối tới server (chỉ để kiểm tra thông tin đăng nhập)
  connectToServer(event: Event): void {
    event.preventDefault();
    this.ftpService.listFiles(this.server, this.port, this.user, this.password)
      .subscribe(
        () => {
          this.connected = true;
          //alert('Kết nối thành công!');
        },
        error => {
          this.connected = false;
          alert('Lỗi kết nối: ' + error.message);
        }
      );
  }

  // Lấy danh sách file
  fetchFiles(): void {
    if (!this.connected) {
      alert('Vui lòng kết nối trước!');
      return;
    }
    this.ftpService.listFiles(this.server, this.port, this.user, this.password, this.currentPath)
      .subscribe(
        (data) => this.files = data,
        (error) => alert('Lỗi khi lấy danh sách file: ' + error.message)
      );
  }

  getFileType(file: {name: string, isFolder: boolean}): string {
    if (file.isFolder) return 'folder';

    const fileName = file.name;
    if (!fileName) return 'unknown';
  
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension) return 'unknown';
  
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) {
      return 'image';
    } else if (['txt', 'log', 'csv', 'md'].includes(extension)) {
      return 'text';
    } else if (['pdf'].includes(extension)) {
      return 'pdf';
    } else if (['doc', 'docx'].includes(extension)) {
      return 'word';
    } else if (['xls', 'xlsx'].includes(extension)) {
      return 'excel';
    } else if (['zip', 'rar', '7z'].includes(extension)) {
      return 'archive';
    } else {
      return 'unknown';
    }
  }

  // Xử lý chọn file để upload
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0]; // Lấy file người dùng chọn
  }

  // Upload file
  uploadFile(): void {
    if (!this.connected) {
      alert('Vui lòng kết nối trước!');
      return;
    }
    console.log("User:", this.user);
    console.log("Password:", this.password);
    if (this.selectedFile) {
      this.ftpService.uploadFile(this.server, this.port, this.user, this.password, this.selectedFile)
        .subscribe({
          next: (response) => {
            alert('File uploaded successfully!');
            this.fetchFiles(); // Cập nhật danh sách file
          },
          error: (error) => {
            console.error('Upload error:', error);
            alert('Error during upload: ' + error.message);
          }
        });
    } else {
      alert('Vui lòng chọn file để upload!');
    }
  }

  toggleFileSelection(file: { name: string, isFolder: boolean }, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedFiles.push(file.name);
    } else {
      this.selectedFiles = this.selectedFiles.filter((f) => f !== file.name);
    }
  }

  downloadSelectedFiles() {
    const serverConfig = {
      server: this.server,
      port: this.port,
      user: this.user,
      password: this.password,
    };

    this.selectedFiles.forEach((file) => {
      this.ftpService.downloadFile(serverConfig, file).subscribe(
        (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        (error) => {
          console.error('Error downloading file:', error);
        }
      );
    });
  }

  renameFile(): void {
    console.log(this.selectedFiles);
    if (this.selectedFiles.length !== 1) {
      alert('Vui lòng chọn một file hoặc thư mục để đổi tên!');
      return;
    }
  
    const oldName = this.selectedFiles[0];
    // Tách tên file và phần mở rộng
    const fileExtension = oldName.substring(oldName.lastIndexOf('.'));
    const fileNameWithoutExtension = oldName.substring(0, oldName.lastIndexOf('.'));
    
    // Yêu cầu người dùng nhập tên mới mà không đổi phần mở rộng
    const newNameWithoutExtension = prompt(`Nhập tên mới cho file "${fileNameWithoutExtension}":`);
    
    if (!newNameWithoutExtension || newNameWithoutExtension.trim() === '') {
      alert('Tên không hợp lệ!');
      return;
    }

    // Kết hợp lại tên file mới với phần mở rộng cũ
    const newName = newNameWithoutExtension + fileExtension;
  
    this.ftpService.renameFile(this.server, this.port, this.user, this.password, oldName, newName)
      .subscribe({
        next: () => {
          alert('Đổi tên thành công!');
          this.fetchFiles(); // Cập nhật danh sách file

          // Sau khi đổi tên thành công, xóa file cũ khỏi selectedFiles
          // Đảm bảo rằng chỉ một file được chọn sau khi đổi tên
          const index = this.selectedFiles.indexOf(oldName);
          if (index > -1) {
            this.selectedFiles.splice(index, 1);
          }
        },
        error: (error) => {
          console.error('Rename error:', error);
          alert('Lỗi khi đổi tên: ' + error.message);
        }
      });
  }
  
  deleteFiles(): void {
    if (!confirm('Bạn có chắc chắn muốn xóa các file/thư mục đã chọn?')) {
      return;
    }

    // Kiểm tra selectedFiles trước khi gọi deleteFiles
    console.log('Selected files:', this.selectedFiles);
    
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
        alert('Không có file nào được chọn.');
        return;
    }
  
    this.ftpService.deleteFiles(this.server, this.port, this.user, this.password, this.selectedFiles)
      .subscribe({
        next: () => {
          alert('Xóa thành công!');
          this.selectedFiles = []; // Xóa danh sách chọn
          this.fetchFiles(); // Cập nhật danh sách file
        },
        error: (error) => {
          console.error('Delete error:', error);
          alert('Lỗi khi xóa: ' + error.message);
        }
      });
  }
  
  createFolder(): void {
    const folderName = prompt('Nhập tên thư mục mới:');
    
    if (!folderName || folderName.trim() === '') {
      alert('Tên thư mục không hợp lệ!');
      return;
    }
  
    this.ftpService.createFolder(this.server, this.port, this.user, this.password, folderName)
      .subscribe({
        next: () => {
          alert('Tạo thư mục thành công!');
          this.fetchFiles(); // Cập nhật danh sách file
        },
        error: (error) => {
          console.error('Create folder error:', error);
          alert('Lỗi khi tạo thư mục: ' + error.message);
        }
      });
  }

  onFolderDoubleClick(file: { name: string, isFolder: boolean }): void {
    if (!file.isFolder) {
      return; // Chỉ xử lý khi nhấn vào folder
    }
    
    // Cập nhật đường dẫn hiện tại
    this.currentPath += `/${file.name}`;
    console.log('Navigating to:', this.currentPath);
    
    // Gửi yêu cầu đến backend để lấy danh sách file bên trong folder
    this.fetchFiles();
  }
  
  navigateUp(): void {
    if (this.currentPath === '/Share') return; // Không cho quay lại khi đang ở thư mục gốc

    // Cập nhật đường dẫn về thư mục cha
    const pathSegments = this.currentPath.split('/');
    pathSegments.pop(); // Loại bỏ thư mục hiện tại
    this.currentPath = pathSegments.join('/') || '/Share';

    console.log('Navigating up to:', this.currentPath);

    // Lấy danh sách file ở thư mục cha
    this.fetchFiles();
  }
}
