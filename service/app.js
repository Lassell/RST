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

function parseFile(fileName) {
  // 读取SRT文件

  const srtFilePath = path.join(__dirname, "/public/uploads/" + fileName);
  const srtContent = fs.readFileSync(srtFilePath, "utf8");

  // console.log("srtContent", srtContent);

  // 分割字幕块
  const subtitleBlocks = srtContent.split("\r\n");

  // 解析每个字幕块
  const subtitles = subtitleBlocks.reduce((subtitles, block, index) => {
    // console.log("insid", block, subtitles);
    const item = block.replaceAll(" ", "");
    if (item) {
      // index
      if (Number(item)) {
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

router.post("/getRstFile", (ctx, next) => {
  try {
    parseFile(ctx.request.files.file.newFilename);

    ctx.body = {
      success: true,
      message: "success",
      data: parseFile(ctx.request.files.file.newFilename),
    };
  } catch (e) {
    ctx.body = {
      success: false,
      message: "上传出错",
      data: null,
    };
  }
});

router.use(ApiRouter());
// router.use("/api", router.routes(), router.allowedMethods());

app
  .use(
    koaBody({
      multipart: true,
      jsonLimit: "5mb",
      formidable: {
        uploadDir: path.join(__dirname, `/public/uploads/`), //上传文件存储目录
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
