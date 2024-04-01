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

/**
 * 转换时间
 * @param {string} timeString 时间字符串
 * @returns {number}
 */
export function convertTimeToMillis(timeString: string) {
  console.log("timeString:", timeString);
  const [time, milliseconds] = timeString.split(",");

  console.log("time", time, milliseconds);
  const [hours, minutes, seconds] = time
    .split(":")
    .map((component) => parseInt(component, 10));

  return (
    (hours * 3600000 +
      minutes * 60000 +
      seconds * 1000 +
      Number(milliseconds)) *
    1000
  );
}
