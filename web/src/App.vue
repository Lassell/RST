<script setup lang="ts">
import {
  ElUpload,
  ElTable,
  ElTableColumn,
  ElButton,
  UploadFile,
} from "element-plus";
import { downloadJSON } from "@/utils";

const tableData = ref<any[]>([]);
const srtContent = ref<any[]>([]);
function handleSrtUpload(res: any) {
  console.log("srtContent:", res.data);
  srtContent.value = res.data;
  tableDataInit();
}

function handleImageUpload(file: UploadFile, index: number) {
  console.log(file, index, 111111111);
  tableData.value[index].imageList.push(file);
}

function tableDataInit() {
  tableData.value = srtContent.value.map((item, index) => ({
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
  downloadJSON(JSON.stringify(tableData.value), "draft_content.json");
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
