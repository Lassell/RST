const Koa = require("koa");
const Router = require("koa-router");
const koaBody = require("koa-body");
const cors = require("@koa/cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = new Koa();

const router = new Router({
  prefix: "/api",
});

function removeUploadFile() {
  const directoryPath = path.join(__dirname, "/uploads/"); // 指定文件夹路径

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }
    files.forEach((file) => {
      if (file !== "placeholder.test") {
        // 排除占位文件
        const currentPath = path.join(directoryPath, file);
        fs.unlink(currentPath, (err) => {
          if (err) {
            return console.log("Error deleting file:", currentPath);
          }
          console.log("File deleted:", currentPath);
        });
      }
    });
  });
}

function parseSrtFile(fileName) {
  try {
    // 读取SRT文件
    const srtFilePath = path.join(__dirname, "/uploads/" + fileName);
    const srtContent = fs.readFileSync(srtFilePath, "utf8");

    // 分割字幕块
    const subtitleBlocks = srtContent.split("\r\n");

    // 解析每个字幕块
    const subtitles = subtitleBlocks.reduce((subtitles, block, index) => {
      const item = block.replaceAll(" ", "");
      if (item) {
        // index
        if (
          Number(item) &&
          (index === 0 || subtitles[subtitles.length - 1]?.text)
        ) {
          subtitles.push({
            index: Number(item),
          });

          return subtitles;
        }

        // time
        if (!subtitles[subtitles.length - 1]?.startTime) {
          const [startTime, endTime] = item.split("-->");
          subtitles[subtitles.length - 1].startTime = startTime;
          subtitles[subtitles.length - 1].endTime = endTime;
          return subtitles;
        }

        if (!subtitles[subtitles.length - 1]?.text) {
          subtitles[subtitles.length - 1].text = item;
          return subtitles;
        }
      }
      return subtitles;
    }, []);

    // 输出解析后的数据
    return subtitles;
  } catch (error) {
    console.log(error);
  }
}

function parseLetterFile(fileName) {
  try {
    // 读取SRT文件
    const letterFilePath = path.join(__dirname, "/uploads/" + fileName);
    const letterContent = fs.readFileSync(letterFilePath, "utf8");
    // 分割段落
    let paragraph = letterContent.split("$").map((i, index) => {
      if (index > 0) {
        return i.slice(2) + "\r\n";
      }
      return i + "\r\n";
    });

    paragraph = paragraph.slice(0, -1);

    // return paragraph;
    // 分割句子
    let senIndex = 1;
    const sentence = paragraph.reduce((sentence, para) => {
      let sen = para.split("\r\n");
      sen = sen.slice(0, -1);
      const senIndexList = sen.map((i) => {
        return senIndex++;
      });
      sentence.push(senIndexList);
      return sentence;
    }, []);
    // 输出解析后的数据
    return sentence;
  } catch (error) {
    console.log(error);
  }
}

const ApiRouter = () => async (ctx, next) => {
  try {
    const data = await next();
    ctx.body = {
      success: true,
      data,
    };
  } catch (error) {
    ctx.body = {
      success: false,
      message: error.message,
    };
  }
};

router.post("/getRstFile", async (ctx, next) => {
  try {
    ctx.body = {
      success: true,
      message: "success",
      data: parseSrtFile(ctx.request.files.file.newFilename),
    };
    removeUploadFile();
  } catch (e) {
    ctx.body = {
      success: false,
      message: "上传出错",
      data: null,
    };
  }
});

router.post("/getLetterFile", async (ctx, next) => {
  try {
    ctx.body = {
      success: true,
      message: "success",
      data: parseLetterFile(ctx.request.files.file.newFilename),
    };
    removeUploadFile();
  } catch (e) {
    ctx.body = {
      success: false,
      message: "上传出错",
      data: null,
    };
  }
});

router.use(ApiRouter());

app
  .use(
    koaBody({
      multipart: true,
      jsonLimit: "5mb",
      formidable: {
        uploadDir: path.join(__dirname, `/uploads/`), //上传文件存储目录
        maxFileSize: 100 * 1024 * 1024, // 设置上传文件大小最大限制,
        keepExtensions: true, //允许保留后缀名
        multipart: true,
      },
    })
  )
  .use(cors())
  .use(async (ctx, next) => {
    ctx.set("Access-Control-Allow-Origin", "*");
    ctx.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild"
    );
    ctx.set("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS");
    if (ctx.method == "OPTIONS") {
      ctx.body = 200;
    } else {
      await next();
    }
  })
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(8006);
console.log("app started at port 8006...");
