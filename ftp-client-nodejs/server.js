const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const ftpService = require("./service/ftpService");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

//API liệt kê file
app.get("/ftp/list", async (req, res) => {
    try {
        const { server, port, user, password, path } = req.query;
        const directoryPath = path || '/Share';
        const fileList = await ftpService.listFiles({ host: server, port, user, password }, directoryPath);
        res.json(fileList);
    } catch (error) {
        console.error("Error listing files:", error);
        res.status(500).json({ error: error.message });
    }
});

// app.get("/ftp/list", async (req, res) => {
//     try {
//         const { server, port, user, password, path } = req.query;
//         const directoryPath = path || '/Share';
//         const fileList = await ftpService.listFiles({ host: server, port, user, password }, directoryPath);
//         res.json(fileList);
//     } catch (error) {
//         console.error("Error listing files:", error);
//         res.status(500).json({ error: error.message });
//     }
// });

// API tải file xuống
app.post("/ftp/download", async (req, res) => {
    const { server, port, user, password, remoteFile } = req.body;

    try {
        const localPath = await ftpService.downloadFile(
            { host: server, port, user, password },
            remoteFile
        );
        res.download(localPath, remoteFile, (err) => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).json({ message: "Error sending file" });
            } else {
                fs.unlinkSync(localPath); // Xóa tệp tạm sau khi gửi
            }
        });
    } catch (error) {
        console.error("Lỗi khi tải file:", error);
        res.status(500).json({ error: error.message });
    }
});

// API tải file lên
app.post("/ftp/upload", upload.single("file"), async (req, res) => {
    const { server, port, user, password, remotePath } = req.body;
    const localFilePath = req.file.path; // Đường dẫn file tạm trên server

    try {
        await ftpService.uploadFile({ host: server, port, user, password }, localFilePath, remotePath + '/' + req.file.originalname);
        res.status(200).json({ message: "File uploaded successfully!" });
    } catch (error) {
        console.error("Error during upload:", error);
        res.status(500).json({ error: error.message });
    } finally {
        // Xóa file tạm sau khi upload xong
        fs.unlink(localFilePath, (err) => {
            if (err) console.error("Failed to delete temp file:", err);
        });
    }
});

// API đổi tên file/thư mục
app.post("/ftp/rename", async (req, res) => {
    const { server, port, user, password, oldName, newName } = req.body;

    try {
        await ftpService.renameFile({ host: server, port, user, password }, oldName, newName);
        res.status(200).json({ message: `Đổi tên thành công từ ${oldName} sang ${newName}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API xóa file/thư mục
app.post("/ftp/delete", async (req, res) => {
    console.log('Received request body:', req.body); // Log toàn bộ body để xem dữ liệu

    const { server, port, user, password, fileNames } = req.body;

    console.log('Received fileNames:', fileNames); // Kiểm tra giá trị nhận được
    if (!fileNames || fileNames.length === 0) {
        return res.status(400).send({ message: 'Không có file nào được chọn để xóa' });
    }

    try {
        await ftpService.deleteFile({ host: server, port, user, password }, fileNames);
        res.status(200).json({ message: `Đã xóa thành công '${fileNames}'` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API tạo thư mục mới
app.post("/ftp/create-folder", async (req, res) => {
    const { server, port, user, password, folderName } = req.body;

    try {
        await ftpService.createFolder({ host: server, port, user, password }, folderName);
        res.status(200).json({ message: `Thư mục '${folderName}' đã được tạo thành công.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`FTP Server running on http://localhost:${port}`);
});
