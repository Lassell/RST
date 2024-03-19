/**
 * 将接口返回的数据下载
 * @param {ajax response} data 要下载的数据
 * @param {string} fileName 文件名
 */
export function downloadJSON(data: any, fileName: string) {
  const filename = fileName;
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement("a");
  link.style.display = "none";
  link.href = url;
  link.setAttribute("download", decodeURIComponent(filename));
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  document.body.removeChild(link);
}
