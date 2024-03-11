<script setup lang="ts">
import { ElUpload } from "element-plus";
</script>

<template>
  <div id="App">
    11111111111
    <el-upload
      action="http://localhost:8006/api/getRstFile"
      accept=".srt"
      list-type="picture-card"
      :show-file-list="false"
    >
    </el-upload>
  </div>
</template>

<style scoped>
.App {
  height: 100%;
  width: 100%;
}
</style>
