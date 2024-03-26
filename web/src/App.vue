<script setup lang="ts">
import {
  ElUpload,
  ElTable,
  ElTableColumn,
  ElButton,
  UploadFile,
} from "element-plus";
import draftContent from "@/assets/draft_content.json";
import draftMateInfo from "@/assets/draft_meta_info.json";
import { downloadJSON } from "@/utils";

type TableData = {
  srtIds: number[];
  imageList: UploadFile[];
};

const filePath = ref<string>("");
const tableData = ref<TableData[]>([]);
const srtContent = ref<any[]>([]);
function handleSrtUpload(res: any) {
  try {
    srtContent.value = res.data.map((i: any) => ({
      ...i,
      id: URL.createObjectURL(new Blob([""]))
        .slice(-36)
        .toUpperCase(),
    }));
    console.log("srtContent:", srtContent.value);
    tableDataInit();
  } catch (error) {
    console.log(error);
  }
}

function handleImageUpload(file: any, index: number) {
  const imageFile = {
    ...file,
    url: filePath.value + file.name,
    uid: URL.createObjectURL(new Blob())
      .slice(-36)
      .toUpperCase() as unknown as number,
  };
  console.log("imageFile:", imageFile, index);
  tableData.value[index].imageList.push(imageFile);
}

function tableDataInit() {
  tableData.value = srtContent.value.map((_item, index) => ({
    srtIds: [index],
    imageList: [],
  }));
}

function srtUpMethod(index: number) {
  tableData.value[index - 1] = {
    srtIds: tableData.value[index - 1].srtIds.concat(
      tableData.value[index].srtIds
    ),
    imageList: tableData.value[index - 1].imageList.concat(
      tableData.value[index].imageList
    ),
  };

  tableData.value.splice(index, 1);
}

function srtDownMethod(index: number) {
  const { srtIds } = tableData.value[index];
  const srtIdsTemp = JSON.parse(JSON.stringify(srtIds));
  if (srtIds.length > 1) {
    const temp = JSON.parse(
      JSON.stringify({
        srtIds: [srtIdsTemp[srtIdsTemp.length - 1]],
        imageList: [],
      })
    );
    srtIds.splice(srtIds.length - 1, 1);
    tableData.value.splice(index + 1, 0, temp);

    console.log(tableData.value);
  }
}

function buildJSONFile() {
  console.log(tableData.value);
  const draft_content = JSON.parse(JSON.stringify(draftContent));
  const draft_meta_info = JSON.parse(JSON.stringify(draftMateInfo));
  draft_meta_info.draft_materials = tableData.value.map((i, index) => ({
    type: index,
    value: i.imageList.map((image: UploadFile) => ({
      ...draftMateInfo.draft_materials[0].value[0],
      id: image.uid,
      file_Path: image.url,
      extra_info: image.name,
      create_time: Math.floor(Date.now() / 1000),
      import_time: Math.floor(Date.now() / 1000),
      import_time_ms: Date.now(),
    })),
  }));

  // draft_content  videos
  draft_content.materials.videos = tableData.value
    .reduce((t: UploadFile[], c) => {
      t.concat(c.imageList);
      return t;
    }, [] as UploadFile[])
    .map((image) => ({
      ...draftContent.materials.videos[0],
      id: image.uid,
      path: image.url,
      material_name: image.name,
    }));

  // draft_content  texts
  draft_content.materials.texts = srtContent.value.map((text) => ({
    ...draftContent.materials.texts[0],
    id: text.id,
    content: draftContent.materials.texts[0].content.replace(
      /\[.+\]/gi,
      text.text
    ),
  }));

  downloadJSON(JSON.stringify(draft_meta_info), "draft_meta_info.json");
  downloadJSON(JSON.stringify(draft_content), "draft_content.json");
}
</script>

<template>
  <div id="App">
    <div style="display: flex; justify-content: space-between; padding: 40px">
      <div>
        <div>上传SRT文件</div>
        <el-upload
          action="http://localhost:8006/api/getRstFile"
          accept=".srt"
          list-type="picture-card"
          :show-file-list="false"
          @success="handleSrtUpload"
        >
        </el-upload>
      </div>
      <el-button style="margin: 40px auto" @click="buildJSONFile"
        >生成文件</el-button
      >
    </div>
    <div style="display: flex">
      <label style="width: 120px; margin-right: 10px">文件夹目录</label>
      <el-input v-model="filePath" style="width: 400px"></el-input>
    </div>

    <el-table :data="tableData">
      <el-table-column label="匹配别名" prop="srtNumber">
        <template #default="{ row, $index }">
          <el-button v-if="$index" type="primary" @click="srtUpMethod($index)">
            向上合并
          </el-button>
          <div v-for="index in row.srtIds" class="table-srt-text">
            {{ srtContent[index].text }}
          </div>
          <el-button
            v-if="row.srtIds.length > 1"
            type="primary"
            @click="srtDownMethod($index)"
          >
            向下拆分
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="选择图片">
        <template #default="{ row, $index }">
          <el-upload
            accept=".png,.jpg,.jpeg"
            list-type="picture-card"
            :file-list="row.imageList"
            :show-file-list="true"
            :limit="9"
            :multiple="true"
            :auto-upload="false"
            :webkitdirectory="true"
            @change="handleImageUpload($event, $index)"
          >
          </el-upload>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.App {
  height: 100%;
  width: 100%;
}

.table-srt-text {
}
</style>
