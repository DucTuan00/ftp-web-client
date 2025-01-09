import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FtpService {
  private baseUrl = 'http://localhost:3000/ftp';

  constructor(private http: HttpClient) {}

  listFiles(server: string, port: number, user: string, password: string, path: string = '/Share'): Observable<{name: string, isFolder: boolean}[]> {
    const params = new HttpParams()
      .set('server', server)
      .set('port', port.toString())
      .set('user', user)
      .set('password', password)
      .set('path', path);
    return this.http.get<{name: string, isFolder: boolean}[]>(`${this.baseUrl}/list`, { params });
  }

  //service new, tam thoi
  // listFiles(server: string, port: number, user: string, password: string, path: string): Observable<string[]> {
  //   const params = new HttpParams()
  //     .set('server', server)
  //     .set('port', port.toString())
  //     .set('user', user)
  //     .set('password', password)
  //     .set('path', path); // Thêm tham số path để xác định folder cần lấy nội dung
  //   return this.http.get<string[]>(`${this.baseUrl}/list`, { params });
  // }

  uploadFile(server: string, port: number, user: string, password: string, file: File, currentPath: string = '/Share'): Observable<string> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    formData.append('remotePath', currentPath);
    formData.append('server', server);
    formData.append('port', port.toString());
    formData.append('user', user);
    formData.append('password', password);
    formData.append('currentPath', currentPath)
    return this.http.post<string>(`${this.baseUrl}/upload`, formData);
  }

  downloadFile(serverConfig: any, remoteFile: string, currentPath: string = '/Share'): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/download`,
      {
        ...serverConfig,
        remoteFile,
        currentPath
      },
      { responseType: 'blob' } // Expect a file (Blob) in response
    );
  }

  renameFile(server: string, port: number, user: string, password: string, oldName: string, newName: string, currentPath: string = '/Share'): Observable<void> {
    const body = { server, port, user, password, oldName, newName, currentPath };
    return this.http.post<void>(`${this.baseUrl}/rename`, body);
  }
  
  deleteFiles(server: string, port: number, user: string, password: string, fileNames: string[], currentPath: string = '/Share'): Observable<void> {
    const body = { server, port, user, password, fileNames, currentPath };
    console.log('Sending body:', body); // Log dữ liệu trước khi gửi
    return this.http.post<void>(`${this.baseUrl}/delete`, body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  createFolder(server: string, port: number, user: string, password: string, folderName: string, currentPath: string = '/Share'): Observable<void> {
    const body = { server, port, user, password, folderName, currentPath };
    return this.http.post<void>(`${this.baseUrl}/create-folder`, body);
  }

  getFileDetails(server: string, port: number, user: string, password: string, fileName: string, currentPath: string): Observable<any> {
    const params = new HttpParams()
      .set('server', server)
      .set('port', port.toString())
      .set('user', user)
      .set('password', password)
      .set('fileName', fileName)
      .set('currentPath', currentPath);
    return this.http.get<any>(`${this.baseUrl}/file-details`, { params });
  }
}
