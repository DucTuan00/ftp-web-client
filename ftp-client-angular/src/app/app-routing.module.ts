import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FileListComponent } from './components/file-list/file-list.component';
import { UploadComponent } from './components/upload/upload.component';

const routes: Routes = [
  { path: '', redirectTo: '/files', pathMatch: 'full' }, // Redirect đến '/files' khi vào '/'
  { path: 'files', component: FileListComponent }, // Danh sách file trên FTP server
  //{ path: 'upload', component: UploadComponent }, // Tải file lên FTP server
  { path: '**', redirectTo: 'files' }, // Redirect nếu không tìm thấy path
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
