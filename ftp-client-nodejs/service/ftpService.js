const ftp = require("basic-ftp");
const fs = require("fs");
const path = require("path");

async function connectToServer({ host, port, user, password }) {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host,
            port,
            user,
            password,
            secure: true,
            secureOptions: {
                rejectUnauthorized: false,  // Bỏ qua kiểm tra chứng chỉ tự ký
            },
        });
        //client.ftp.useDefaultSettings(); // Đảm bảo sử dụng Passive Mode
        console.log("Successfully connected to FTPS server");
        return client;
    } catch (error) {
        console.error("Failed to connect:", error);
        throw error;
    }
}

async function listFiles(config, path = '/Share') {
    const client = await connectToServer(config);
    try {
        await client.cd(path);
        console.log("Current working directory:", path);
        const fileList = await client.list();
        //fileList.forEach(file => console.log(`File: ${file.name}, Type: ${file.type}`));
        return fileList.map(file => ({
            name: file.name,
            isFolder: file.type === 'd' || file.type === 2 // Đánh dấu nếu là thư mục
        }));
    } finally {
        client.close();
    }
}

// async function listFiles(config, path) {
//     const client = await connectToServer(config);
//     try {
//         console.log(`Trying to change directory to: ${path}`);
//         await client.cd(path); // Chuyển đến thư mục được cung cấp
//         console.log("Current working directory:", path);
//         const fileList = await client.list();
//         return fileList.map(file => ({
//             name: file.name,
//             isFolder: file.type === 'd' // Đánh dấu nếu là thư mục
//         }));
//     } catch (error) {
//         console.error("Error changing directory or listing files:", error);
//         throw new Error("Couldn't change to the specified directory.");
//     } finally {
//         client.close();
//     }
// }

async function downloadFile(config, fileName, currentPath = '/Share') {
    const client = await connectToServer(config);

    const localFolder = "D:/Downloads"; // Thư mục lưu trữ
    const localPath = path.join(localFolder, path.basename(fileName)); // Kết hợp thư mục với tên file

    try {
        // Chuyển đến thư mục đúng trên server
        await client.cd(currentPath);

        const files = await client.list();
        const fileExists = files.some(file => file.name === path.basename(fileName));

        if (!fileExists) {
            console.error("File không tồn tại trên server FTP:", fileName);
            throw new Error("File không tồn tại trên server FTP.");
        }

        console.log("Attempting to download:", fileName);
        console.log("Saving to:", localPath);
        await client.downloadTo(localPath, fileName);
        console.log("File downloaded to:", localPath);
        return localPath;
    } catch (error) {
        if (error.code === 550) {
            console.error("Lỗi khi tải file: Không có quyền truy cập hoặc file không tồn tại.");
        } else {
            console.error("Lỗi không xác định:", error);
        }
        throw error;
    } finally {
        client.close();
    }
}

async function uploadFile(config, localFilePath, remotePath) {
    const client = await connectToServer(config);
    try {
        await client.uploadFrom(localFilePath, remotePath);
        console.log("File uploaded:", localFilePath);
    } finally {
        client.close();
    }
}

// Đổi tên file/thư mục
async function renameFile(config, oldName, newName, currentPath = '/Share') {
    const client = await connectToServer(config);
    try {
        await client.rename(`${currentPath}/${oldName}`, `${currentPath}/${newName}`);
    } finally {
        client.close();
    }
}

// Xóa file/thư mục
async function deleteFile(config, fileNames, currentPath = '/Share') {
    const client = await connectToServer(config);
    
    try {
        // Chuyển đến thư mục đúng trên server
        await client.cd(currentPath);

        for (const targetName of fileNames) {
            const currentDir = await client.pwd();
            console.log(`Current directory: ${currentDir}`);

            // Lấy danh sách file/thư mục
            const files = await client.list();
            console.log('Files from server:', files);
            console.log('Files:', files.map(file => file.name));

            // Kiểm tra nếu file/thư mục tồn tại
            const targetFile = files.find(file => file.name === targetName);

            if (!targetFile) {
                console.error(`File/Folder "${targetName}" does not exist.`);
                throw new Error(`File/Folder "${targetName}" does not exist.`);
            }

            if (targetFile.type === 2 || targetFile.type === 'd') {
                // Xử lý xóa thư mục
                console.log(`Deleting folder: ${targetName}`);
                await deleteFolderRecursive(client, targetName);
                console.log(`Folder "${targetName}" has been deleted.`);
            } else {
                // Xóa file
                console.log(`Deleting file: ${targetName}`);
                await client.remove(targetName);
                console.log(`File "${targetName}" has been deleted.`);
            }
        }
    } catch (error) {
        console.error('Delete error:', error);
        throw error;
    } finally {
        client.close();
    }
}

async function deleteFolderRecursive(client, folderName) {
    // Chuyển vào thư mục
    await client.cd(folderName);

    // Lấy danh sách nội dung trong thư mục
    const items = await client.list();

    for (const item of items) {
        if (item.type === 'd' || item.type === 2) {
            // Đệ quy để xóa thư mục con
            await deleteFolderRecursive(client, item.name);
        } else {
            // Xóa file
            await client.remove(item.name);
        }
    }

    // Quay lại thư mục cha
    await client.cdup();

    // Xóa thư mục
    await client.send(`RMD ${folderName}`);
}

// Tạo thư mục mới
async function createFolder(config, folderName, currentPath = '/Share') {
    const client = await connectToServer(config);
    try {
        await client.ensureDir(`${currentPath}/${folderName}`);
    } finally {
        client.close();
    }
}

async function getFileDetails(config, fileName, currentPath = '/Share') {
    const client = await connectToServer(config);
    try {
        await client.cd(currentPath);
        const fileList = await client.list();
        const file = fileList.find(f => f.name === fileName);
        if (!file) {
            throw new Error(`File "${fileName}" not found.`);
        }
        return {
            size: file.size,
            modified: file.modifiedAt.toString() // Assuming you have modified time
        };
    } finally {
        client.close();
    }
}

module.exports = {
    listFiles,
    downloadFile,
    uploadFile,
    renameFile,
    deleteFile,
    createFolder,
    getFileDetails,
};
