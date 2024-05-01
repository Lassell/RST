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
import { downloadJSON, convertTimeToMillis } from "@/utils";

type TableData = {
  id: string[];
  srtIds: number[];
  image: UploadFile | null;
  startTime?: number;
  endTime?: number;
};

const filePath = ref<string>("");
const tableData = ref<TableData[]>([]);
const srtContent = ref<
  {
    id: string;
    index: number;
    startTime: string;
    endTime: string;
    text: string;
  }[]
>([]);

function handleSrtUpload(res: any) {
  try {
    srtContent.value = res.data.map((i: any) => ({
      ...i,
      id: URL.createObjectURL(new Blob()).slice(-36).toUpperCase(),
    }));
    tableDataInit();
  } catch (error) {
    console.log(error);
  }
}

function handleImageUpload(file: any, index: number) {
  const imageFile = {
    ...file,
    url: filePath.value + file.name,
    uid: URL.createObjectURL(new Blob()).slice(-36).toUpperCase(),
  };
  tableData.value[index].image = imageFile;
  console.log(tableData.value);
}

function tableDataInit() {
  tableData.value = srtContent.value.map((_item, index) => ({
    id: [_item.id],
    srtIds: [index],
    image: null,
  }));
}

function srtUpMethod(index: number) {
  tableData.value[index - 1] = {
    ...tableData.value[index - 1],
    id: tableData.value[index - 1].id.concat(tableData.value[index].id),
    srtIds: tableData.value[index - 1].srtIds.concat(
      tableData.value[index].srtIds
    ),
  };

  tableData.value.splice(index, 1);
}

function srtDownMethod(index: number) {
  const { srtIds, id } = tableData.value[index];
  const idTemp = JSON.parse(JSON.stringify(srtIds));
  const srtIdsTemp = JSON.parse(JSON.stringify(srtIds));
  if (srtIds.length > 1) {
    const temp = JSON.parse(
      JSON.stringify({
        ...tableData.value[index],
        id: [idTemp[idTemp.length - 1]],
        srtIds: [srtIdsTemp[srtIdsTemp.length - 1]],
        image: null,
      })
    );
    id.splice(id.length - 1, 1);
    srtIds.splice(srtIds.length - 1, 1);
    tableData.value.splice(index + 1, 0, temp);
  }
}

function buildJSONFile() {
  const draft_content = JSON.parse(JSON.stringify(draftContent));
  const draft_meta_info = JSON.parse(JSON.stringify(draftMateInfo));
  tableData.value = tableData.value.map((item) => {
    return {
      ...item,
      startTime: convertTimeToMillis(
        srtContent.value[item.srtIds[0]].startTime || ""
      ),
      endTime: convertTimeToMillis(
        srtContent.value[item.srtIds[item.srtIds.length - 1]].endTime || ""
      ),
    };
  });

  draft_meta_info.draft_materials = [
    {
      type: 0,
      value: tableData.value.map((i, index) => {
        let duration = (i?.endTime || 0) - (i.startTime || 0);
        if (index % 2) {
          return {
            ...draftMateInfo.draft_materials[0].value[0],
            id: String(i.image?.uid || ""),
            duration,
            file_Path: i.image?.url || ("" as string),
            extra_info: i.image?.name || "",
            create_time: Math.floor(Date.now() / 1000),
            import_time: Math.floor(Date.now() / 1000),
            import_time_ms: Date.now(),
          };
        }

        return {
          ...draftMateInfo.draft_materials[0].value[1],
          id: URL.createObjectURL(new Blob()).slice(-36).toUpperCase(),
          create_time: Math.floor(Date.now() / 1000),
          import_time: Math.floor(Date.now() / 1000),
          import_time_ms: Date.now(),
          duration,
        };
      }),
    },
  ];

  draft_content.tracks = [
    {
      ...draftContent.tracks[0],
      segments: tableData.value.reduce((t, c, index) => {
        let start = index === 0 ? 0 : t[t.length - 1].target_timerange.start;
        let duration = (c?.endTime || 0) - (c?.startTime || 0);
        t.push({
          ...draftContent.tracks[0].segments[0],
          id: URL.createObjectURL(new Blob()).slice(-36).toUpperCase(),
          material_id: c.image?.uid || "",
          target_timerange: {
            duration,
            start,
          },
          source_timerange: {
            duration,
            start: 0,
          },
        });
        return t;
      }, [] as any),
    },
    {
      ...draftContent.tracks[1],
      segments: tableData.value.reduce((t, c) => {
        t = t.concat(
          c.srtIds.map((i: number) => ({
            ...draftContent.tracks[1].segments[0],
            id: URL.createObjectURL(new Blob()).slice(-36).toUpperCase(),
            material_id: srtContent.value[i].id || "",
            target_timerange: {
              start: convertTimeToMillis(srtContent.value[i].startTime),
              duration:
                convertTimeToMillis(srtContent.value[i].endTime) -
                convertTimeToMillis(srtContent.value[i].startTime),
            },
            source_timerange: {
              duration:
                convertTimeToMillis(srtContent.value[i].endTime) -
                convertTimeToMillis(srtContent.value[i].startTime),
              start: 0,
            },
          }))
        );
        return t;
      }, [] as any),
    },
    {
      id: URL.createObjectURL(new Blob()).slice(-36).toUpperCase(),
      attribute: 0,
      flag: 0,
      segments: [],
      type: "audio",
    },
  ];

  // draft_content  videos
  draft_content.materials.videos = tableData.value.map((item, index) => ({
    ...draftContent.materials.videos[0],
    id: String(item.image?.uid),
    path: item.image?.url as string,
    material_name: item.image?.name,
    duration: draft_content.tracks[0].segments[index].target_timerange.duration,
  }));

  // draft_content  texts
  draft_content.materials.texts = srtContent.value.map((text) => {
    return {
      ...draftContent.materials.texts[0],
      id: text.id,
      content: draftContent.materials.texts[0].content.replace(
        /(?<=\>\[)[\u4e00-\u9fa5]+(?=\]\<\/)/gi,
        text.text
      ),
    };
  });

  // draft_content duration
  draft_content.duration = tableData.value[tableData.value.length - 1].endTime;

  downloadJSON(JSON.stringify(draft_meta_info), "draft_meta_info.json");
  downloadJSON(JSON.stringify(draft_content), "draft_content.json");
}

function handleChange() {
  if (!filePath.value.endsWith("\\")) {
    filePath.value = filePath.value + "\\";
    return;
  }
}
</script>

<template>
  <div id="App">
    <div style="display: flex; justify-content: space-between; padding: 40px">
      <div style="text-align: left; margin-right: 40px">
        <div style="display: flex; margin-bottom: 20px">
          <label style="width: 200px; margin-right: 10px"
            >请先填写图片文件夹目录</label
          >
          <el-input
            v-model="filePath"
            style="width: 400px"
            @change="handleChange"
          ></el-input>
        </div>
        <div style="display: flex">
          <label style="width: 200px; margin-right: 10px" v-if="filePath"
            >上传SRT文件</label
          >
          <el-upload
            action="http://localhost:8006/api/getRstFile"
            accept=".srt"
            list-type="picture-card"
            :show-file-list="false"
            @success="handleSrtUpload"
            v-if="filePath"
          >
          </el-upload>
        </div>
      </div>
      <el-button
        style="margin: 40px auto"
        @click="buildJSONFile"
        v-if="filePath"
        >生成文件</el-button
      >
    </div>
    <el-table :data="tableData" v-if="filePath">
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
            :limit="1"
            :multiple="false"
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
